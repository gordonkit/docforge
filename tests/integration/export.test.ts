import { existsSync, mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';
import { exportDocx, ExportError, previewDocx } from '../../src/exporters/docx.js';
import { loadDocument } from '../../src/load.js';
import { exportToolsAvailable, libreOfficeAvailable } from './tools.js';

const examples = resolve(import.meta.dirname, '..', '..', 'examples');

let available = false;
let libreOffice = false;
beforeAll(async () => {
  available = await exportToolsAvailable();
  libreOffice = await libreOfficeAvailable();
}, 120_000);

describe('docx export (needs gordon-doc and Pandoc)', () => {
  it('exports the example with every feature verified', async (context) => {
    if (!available) return context.skip();
    const { document, baseDir } = await loadDocument(join(examples, 'report.json'));
    const output = join(mkdtempSync(join(tmpdir(), 'docforge-it-')), 'report.docx');

    const result = await exportDocx(document, { baseDir, output });

    expect(result.verified).toEqual(['header', 'footer', 'toc', 'footnotes', 'images', 'page-breaks', 'template']);
    const files = unzipSync(await readFile(output));
    const body = strFromU8(files['word/document.xml']!);
    expect(body).toContain('Quarterly Operations Report');
    // The author is a document property, not visible text at the top of the page.
    expect(body).not.toContain('Operations Team');
    expect(strFromU8(files['docProps/core.xml']!)).toContain('Operations Team');
  }, 120_000);

  it('refuses to overwrite without --overwrite', async (context) => {
    if (!available) return context.skip();
    const { document, baseDir } = await loadDocument(join(examples, 'report.json'));
    const output = join(mkdtempSync(join(tmpdir(), 'docforge-it-')), 'report.docx');
    await exportDocx(document, { baseDir, output });
    expect(existsSync(output)).toBe(true);
    await expect(exportDocx(document, { baseDir, output })).rejects.toBeInstanceOf(ExportError);
    await expect(exportDocx(document, { baseDir, output, overwrite: true })).resolves.toBeDefined();
  }, 180_000);
});

describe('preview (needs gordon-doc, Pandoc and LibreOffice)', () => {
  it('renders the example to a PDF and one PNG per page', async (context) => {
    if (!libreOffice) return context.skip();
    const { document, baseDir } = await loadDocument(join(examples, 'report.json'));
    const outputDir = mkdtempSync(join(tmpdir(), 'docforge-it-'));

    const result = await previewDocx(document, { baseDir, outputDir, engine: 'libreoffice' });

    expect(result.engine).toBe('libreoffice');
    expect((await readFile(result.pdf)).subarray(0, 5).toString()).toBe('%PDF-');
    expect(result.pages.length).toBeGreaterThan(0);
    for (const page of result.pages) expect(existsSync(page)).toBe(true);
  }, 300_000);
});
