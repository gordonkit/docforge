import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { renderHtml } from '../renderers/html.js';
import type { Block, DocForgeDocument, Inline } from '../schemas/document.js';
import { getTemplate } from '../templates/default.js';
import { ToolError, ensurePandoc, runGordonDoc } from './gordon-doc.js';

export interface ExportOptions {
  /** Directory of the document JSON (image paths resolve against it). */
  baseDir: string;
  output: string;
  overwrite?: boolean;
}

export interface ExportResult {
  output: string;
  /** Structural checks that were run against the written DOCX. */
  verified: string[];
}

export class ExportError extends Error {}

function countFootnotes(inline: Inline): number {
  return typeof inline === 'string' ? 0 : inline.filter((run) => typeof run === 'object' && 'footnote' in run).length;
}

function blockInlines(block: Block): Inline[] {
  switch (block.type) {
    case 'paragraph':
    case 'quote':
      return [block.text];
    case 'list': {
      const collect = (items: typeof block.items): Inline[] =>
        items.flatMap((item) => (typeof item === 'string' ? [item] : [item.text, ...(item.children ? collect(item.children) : [])]));
      return collect(block.items);
    }
    case 'table':
      return block.rows.flat();
    default:
      return [];
  }
}

/** What the DOCX must contain for the document to be considered faithfully exported. */
export interface Expectations {
  header: boolean;
  footer: boolean;
  toc: boolean;
  footnotes: number;
  images: number;
  pageBreaks: number;
}

export function expectationsFor(document: DocForgeDocument): Expectations {
  return {
    header: document.header !== undefined,
    footer: document.footer !== undefined,
    toc: document.blocks.some((block) => block.type === 'toc'),
    footnotes: document.blocks.flatMap(blockInlines).reduce((sum, inline) => sum + countFootnotes(inline), 0),
    images: document.blocks.filter((block) => block.type === 'image').length,
    pageBreaks: document.blocks.filter(
      (block) => block.type === 'pageBreak' || (block.type === 'heading' && block.pageBreakBefore),
    ).length,
  };
}

/** Compare a DOCX package against expectations; returns problems and the checks that passed. */
export function checkDocx(bytes: Uint8Array, expected: Expectations): { problems: string[]; verified: string[] } {
  const files = unzipSync(bytes);
  const text = (name: string): string | undefined => {
    const data = files[name];
    return data === undefined ? undefined : strFromU8(data);
  };
  const documentXml = text('word/document.xml') ?? '';
  const problems: string[] = [];
  const verified: string[] = [];
  const check = (label: string, ok: boolean, detail: string): void => {
    if (ok) verified.push(label);
    else problems.push(detail);
  };

  if (expected.header) check('header', files['word/gordon-header.xml'] !== undefined && documentXml.includes('headerReference'), 'header is missing from the DOCX');
  if (expected.footer) check('footer', files['word/gordon-footer.xml'] !== undefined && documentXml.includes('footerReference'), 'footer is missing from the DOCX');
  if (expected.toc) check('toc', /TOC \\o/.test(documentXml), 'table of contents field is missing from the DOCX');
  if (expected.footnotes > 0) {
    const references = (documentXml.match(/<w:footnoteReference /g) ?? []).length;
    check('footnotes', references === expected.footnotes, `expected ${expected.footnotes} footnotes but the DOCX has ${references}`);
  }
  if (expected.images > 0) {
    const drawings = (documentXml.match(/<w:drawing>/g) ?? []).length;
    check('images', drawings >= expected.images, `expected ${expected.images} images but the DOCX has ${drawings}`);
  }
  if (expected.pageBreaks > 0) {
    const breaks = (documentXml.match(/<w:pageBreakBefore|<w:br w:type="page"/g) ?? []).length;
    check('page-breaks', breaks >= expected.pageBreaks, `expected ${expected.pageBreaks} page breaks but the DOCX has ${breaks}`);
  }
  return { problems, verified };
}

/** Render the document to HTML, convert it to DOCX with gordon-doc, and verify the result. */
export async function exportDocx(document: DocForgeDocument, options: ExportOptions): Promise<ExportResult> {
  const output = resolve(options.output);
  if (extname(output).toLowerCase() !== '.docx') throw new ExportError('output must end with .docx');
  if (existsSync(output) && !options.overwrite) throw new ExportError(`${output} already exists; pass --overwrite to replace it`);
  await ensurePandoc();
  const template = getTemplate(document.template);
  const workspace = await mkdtemp(join(tmpdir(), 'docforge-'));
  try {
    const htmlPath = join(workspace, `${basename(output, '.docx')}.html`);
    await writeFile(
      htmlPath,
      renderHtml(document, { ...(template ? { template } : {}), mode: 'export', baseDir: options.baseDir, outputDir: workspace }),
      'utf8',
    );
    await mkdir(dirname(output), { recursive: true });
    await runGordonDoc(['convert', htmlPath, '--to', 'docx', '-o', output, '--overwrite']);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
  const { problems, verified } = checkDocx(await readFile(output), expectationsFor(document));
  if (problems.length > 0) {
    await rm(output, { force: true });
    throw new ExportError(`the converter produced a degraded DOCX (removed): ${problems.join('; ')}`);
  }
  return { output, verified };
}

export interface PreviewResult {
  docx: string;
  pdf: string;
  pages: string[];
  engine: string;
}

/** Export, then render the DOCX to PDF and PNG pages (Word COM when available). */
export async function previewDocx(document: DocForgeDocument, options: { baseDir: string; outputDir: string; dpi?: number; engine?: string }): Promise<PreviewResult> {
  const outputDir = resolve(options.outputDir);
  await mkdir(outputDir, { recursive: true });
  const docx = join(outputDir, 'document.docx');
  await exportDocx(document, { baseDir: options.baseDir, output: docx, overwrite: true });
  const pdf = join(outputDir, 'document.pdf');
  const engineArgs = options.engine ? ['--engine', options.engine] : [];
  const converted = await runGordonDoc(['convert', docx, '--to', 'pdf', '-o', pdf, '--overwrite', ...engineArgs]);
  const engine = /Converted with ([\w-]+)/.exec(converted.stdout)?.[1];
  if (!engine) throw new ToolError('gordon-doc did not report a rendering engine for the PDF');
  const pagesDir = join(outputDir, 'pages');
  await rm(pagesDir, { recursive: true, force: true });
  await runGordonDoc(['convert', pdf, '--to', 'images', '-o', pagesDir, '--overwrite', '--dpi', String(options.dpi ?? 100)]);
  const pages = (await readdir(pagesDir)).filter((name) => /\.(png|jpe?g)$/i.test(name)).sort().map((name) => join(pagesDir, name));
  return { docx, pdf, pages, engine };
}
