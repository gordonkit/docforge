import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { checkDocx, expectationsFor } from '../../src/exporters/docx.js';
import { loadDocument } from '../../src/load.js';
import { renderHtml } from '../../src/renderers/html.js';
import { type DocForgeDocument, parseDocument } from '../../src/schemas/document.js';
import { lintDocument } from '../../src/validators/lint.js';

const examples = resolve(import.meta.dirname, '..', '..', 'examples');

function doc(blocks: unknown[], extra: Record<string, unknown> = {}): DocForgeDocument {
  const result = parseDocument({ version: 1, title: 'T', blocks, ...extra });
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.document;
}

describe('schema', () => {
  it('accepts the bundled example', async () => {
    const loaded = await loadDocument(join(examples, 'report.json'));
    expect(loaded.document.blocks.length).toBeGreaterThan(10);
    expect(loaded.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('rejects unknown fields and reports their location', () => {
    const result = parseDocument({ version: 1, title: 'T', blocks: [{ type: 'paragraph', text: 'x', style: 'color:red' }] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe('$.blocks[0]');
  });

  it('requires alt text on images', () => {
    const result = parseDocument({ version: 1, title: 'T', blocks: [{ type: 'image', src: 'a.png', alt: ' ' }] });
    expect(result.ok).toBe(false);
  });

  it('rejects rows whose cell count differs from the columns', () => {
    const result = parseDocument({
      version: 1,
      title: 'T',
      blocks: [{ type: 'table', columns: [{ header: 'A', width: 100 }], rows: [['1', '2']] }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe('$.blocks[0].rows[0]');
  });

  it('rejects unsafe link targets', () => {
    const result = parseDocument({
      version: 1,
      title: 'T',
      blocks: [{ type: 'paragraph', text: [{ text: 'x', href: 'javascript:alert(1)' }] }],
    });
    expect(result.ok).toBe(false);
  });
});

describe('lint', () => {
  const base = { baseDir: examples };
  const codes = (d: DocForgeDocument): string[] => lintDocument(d, base).map((issue) => issue.code);

  it('flags heading level skips and multiple h1', () => {
    const d = doc([
      { type: 'heading', level: 1, text: 'A' },
      { type: 'heading', level: 3, text: 'B' },
      { type: 'heading', level: 1, text: 'C' },
    ]);
    expect(codes(d)).toEqual(expect.arrayContaining(['heading-level-skip', 'multiple-h1']));
  });

  it('flags table widths that do not add up to 100', () => {
    const d = doc([{ type: 'table', columns: [{ header: 'A', width: 30 }, { header: 'B', width: 30 }], rows: [['1', '2']] }]);
    const issue = lintDocument(d, base).find((item) => item.code === 'table-width-sum');
    expect(issue?.severity).toBe('error');
  });

  it('flags missing and remote images as errors', () => {
    const d = doc([
      { type: 'image', src: 'assets/nope.png', alt: 'x' },
      { type: 'image', src: 'https://example.com/a.png', alt: 'x' },
      { type: 'image', src: 'assets/small.png', alt: 'ok' },
    ]);
    expect(codes(d)).toEqual(['image-missing', 'image-remote']);
  });

  it('flags unknown templates and placeholders', () => {
    const d = doc([{ type: 'paragraph', text: 'x' }], { template: 'fancy', footer: 'Page {pg}' });
    expect(codes(d)).toEqual(expect.arrayContaining(['unknown-template', 'unknown-placeholder']));
  });

  it('flags a toc without headings', () => {
    expect(codes(doc([{ type: 'toc' }]))).toContain('toc-without-headings');
  });
});

describe('html renderer', () => {
  const options = { baseDir: examples, outputDir: examples };

  it('emits the markup gordon-doc understands', async () => {
    const { document } = await loadDocument(join(examples, 'report.json'));
    const html = renderHtml(document, { ...options, mode: 'export' });
    expect(html).toContain('<meta name="gordon-header" content="Acme Corp — Confidential">');
    expect(html).toContain('<meta name="gordon-footer" content="Page {page} of {pages}">');
    expect(html).toContain('<div class="toc" data-depth="2" data-title="Contents"></div>');
    expect(html).toContain('<colgroup><col style="width:40%">');
    expect(html).toContain('<h2 style="break-before: page">3. Appendix</h2>');
    expect(html).toContain('<section class="footnotes"');
    expect(html).toContain('<img src="assets/wide.png" alt="Placeholder chart" width="80%">');
    expect(html).not.toContain('<style>');
  });

  it('embeds CSS and shows running text in preview mode', async () => {
    const { document } = await loadDocument(join(examples, 'report.json'));
    const html = renderHtml(document, { ...options, mode: 'preview' });
    expect(html).toContain('<style>');
    expect(html).toContain('class="running footer">Page 1 of N');
    expect(html).not.toContain('name="gordon-header"');
  });

  it('escapes user text', () => {
    const html = renderHtml(doc([{ type: 'paragraph', text: '<script>alert("x")</script> & more' }]), { ...options, mode: 'export' });
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more');
    expect(html).not.toContain('<script>');
  });

  it('numbers footnotes in document order, including inside tables', () => {
    const html = renderHtml(
      doc([
        { type: 'paragraph', text: ['a', { footnote: 'one' }] },
        { type: 'table', columns: [{ header: 'H', width: 100 }], rows: [[['b', { footnote: 'two' }]]] },
      ]),
      { ...options, mode: 'export' },
    );
    expect(html).toContain('id="fnref2"');
    expect(html.indexOf('<li id="fn1"><p>one')).toBeLessThan(html.indexOf('<li id="fn2"><p>two'));
  });

  it('writes image paths relative to the output directory', () => {
    const outputDir = mkdtempSync(join(tmpdir(), 'docforge-test-'));
    const html = renderHtml(doc([{ type: 'image', src: 'assets/small.png', alt: 'a' }]), {
      baseDir: examples,
      outputDir,
      mode: 'export',
    });
    const match = /<img src="([^"]+)"/.exec(html);
    expect(match?.[1]).toMatch(/assets\/small\.png$/);
  });
});

describe('docx verification', () => {
  function docx(files: Record<string, string>): Uint8Array {
    return zipSync(Object.fromEntries(Object.entries(files).map(([name, text]) => [name, strToU8(text)])));
  }

  it('derives expectations from the document', async () => {
    const { document } = await loadDocument(join(examples, 'report.json'));
    expect(expectationsFor(document)).toEqual({ header: true, footer: true, toc: true, footnotes: 1, images: 1, pageBreaks: 2 });
  });

  it('passes a package that has everything the document asked for', () => {
    const bytes = docx({
      'word/document.xml':
        '<w:headerReference/><w:footerReference/>TOC \\o "1-2"<w:footnoteReference w:id="1"/><w:drawing></w:drawing><w:pageBreakBefore/><w:br w:type="page"/>',
      'word/gordon-header.xml': '<x/>',
      'word/gordon-footer.xml': '<x/>',
    });
    const result = checkDocx(bytes, { header: true, footer: true, toc: true, footnotes: 1, images: 1, pageBreaks: 2 });
    expect(result.problems).toEqual([]);
    expect(result.verified).toEqual(['header', 'footer', 'toc', 'footnotes', 'images', 'page-breaks']);
  });

  it('reports a degraded package where features were dropped', () => {
    const bytes = docx({ 'word/document.xml': '<w:p/>' });
    const result = checkDocx(bytes, { header: true, footer: false, toc: true, footnotes: 2, images: 0, pageBreaks: 1 });
    expect(result.problems).toHaveLength(4);
  });
});

describe('loadDocument', () => {
  it('reports invalid JSON and schema errors distinctly', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'docforge-test-'));
    writeFileSync(join(dir, 'bad.json'), '{ nope');
    writeFileSync(join(dir, 'schema.json'), JSON.stringify({ version: 2, title: '', blocks: [] }));
    await expect(loadDocument(join(dir, 'bad.json'))).rejects.toThrow(/not valid JSON/);
    await expect(loadDocument(join(dir, 'schema.json'))).rejects.toMatchObject({ schemaIssues: expect.any(Array) });
    await expect(loadDocument(join(dir, 'missing.json'))).rejects.toThrow(/cannot read/);
  });
});
