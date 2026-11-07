import { existsSync, mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';
import { exportDocx, ExportError } from '../../src/exporters/docx.js';
import { ensurePandoc, findGordonDoc } from '../../src/exporters/gordon-doc.js';
import { loadDocument } from '../../src/load.js';

const examples = resolve(import.meta.dirname, '..', '..', 'examples');

let available = false;
beforeAll(async () => {
  try {
    await findGordonDoc();
    await ensurePandoc();
    available = true;
  } catch {
    available = false;
  }
});

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
