import { copyFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ExportError, exportDocx } from '../../src/exporters/docx.js';
import { ToolError, checkConverterVersion, findGordonDoc } from '../../src/exporters/gordon-doc.js';
import { locateImage } from '../../src/images.js';
import { type DocForgeDocument, parseDocument } from '../../src/schemas/document.js';
import { lintDocument } from '../../src/validators/lint.js';

const examples = resolve(import.meta.dirname, '..', '..', 'examples');

function doc(blocks: unknown[]): DocForgeDocument {
  const result = parseDocument({ version: 1, title: 'T', blocks });
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.document;
}

/** A document folder with an image inside it and another image next to it. */
function workspace(): { baseDir: string; outside: string } {
  const root = mkdtempSync(join(tmpdir(), 'docforge-sec-'));
  const baseDir = join(root, 'doc');
  mkdirSync(join(baseDir, 'img'), { recursive: true });
  copyFileSync(join(examples, 'assets', 'small.png'), join(baseDir, 'img', 'inside.png'));
  const outside = join(root, 'outside.png');
  copyFileSync(join(examples, 'assets', 'small.png'), outside);
  return { baseDir, outside };
}

describe('image paths', () => {
  it('accepts files in the document folder and its subfolders', () => {
    const { baseDir } = workspace();
    expect(locateImage('img/inside.png', baseDir).ok).toBe(true);
    expect(locateImage('img/../img/inside.png', baseDir).ok).toBe(true);
  });

  it('rejects parent-relative, absolute and URL sources', () => {
    const { baseDir, outside } = workspace();
    expect(locateImage('../outside.png', baseDir)).toEqual({ ok: false, reason: 'outside' });
    expect(locateImage('img/../../outside.png', baseDir)).toEqual({ ok: false, reason: 'outside' });
    expect(locateImage(outside, baseDir).ok).toBe(false);
    expect(locateImage('/etc/passwd', baseDir)).toEqual({ ok: false, reason: 'outside' });
    expect(locateImage('file:///etc/passwd', baseDir)).toEqual({ ok: false, reason: 'remote' });
  });

  it('lint reports an existing file outside the document folder as an error', () => {
    const { baseDir } = workspace();
    const issues = lintDocument(doc([{ type: 'image', src: '../outside.png', alt: 'x' }]), { baseDir });
    expect(issues.map((issue) => [issue.code, issue.severity])).toEqual([['image-outside-document', 'error']]);
  });

  it('export refuses such an image before running any tool', async () => {
    const { baseDir } = workspace();
    const output = join(baseDir, 'out.docx');
    const document = doc([{ type: 'image', src: '../outside.png', alt: 'x' }]);
    await expect(exportDocx(document, { baseDir, output })).rejects.toBeInstanceOf(ExportError);
  });
});

describe('gordon-doc lookup', () => {
  const saved = process.env.DOCFORGE_GORDON_DOC;
  afterEach(() => {
    if (saved === undefined) delete process.env.DOCFORGE_GORDON_DOC;
    else process.env.DOCFORGE_GORDON_DOC = saved;
  });

  it('accepts 1.0.0 and later, including release candidates', () => {
    expect(() => checkConverterVersion('gordon-doc 1.0.0')).not.toThrow();
    expect(() => checkConverterVersion('gordon-doc 1.0.0rc2')).not.toThrow();
    expect(() => checkConverterVersion('gordon-doc 2.3.1')).not.toThrow();
    expect(() => checkConverterVersion('no version here')).not.toThrow();
  });

  it('rejects converters older than 1.0.0 with an upgrade hint', () => {
    expect(() => checkConverterVersion('gordon-doc 0.12.0')).toThrow(ToolError);
    expect(() => checkConverterVersion('gordon-doc 0.12.0')).toThrow(/1\.0\.0 or later/);
  });

  it('fails clearly when DOCFORGE_GORDON_DOC names a missing file', async () => {
    process.env.DOCFORGE_GORDON_DOC = join(tmpdir(), 'docforge-no-such-gordon-doc');
    await expect(findGordonDoc()).rejects.toThrow(/DOCFORGE_GORDON_DOC points to a missing file/);
  });
});
