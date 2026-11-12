import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../../src/cli/run.js';

let dir: string;
let out: string[];
let err: string[];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'docforge-cli-'));
  out = [];
  err = [];
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => void out.push(args.join(' ')));
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => void err.push(args.join(' ')));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function write(name: string, value: unknown): string {
  const file = join(dir, name);
  writeFileSync(file, JSON.stringify(value));
  return file;
}

const valid = { version: 1, title: 'T', blocks: [{ type: 'heading', level: 1, text: 'T' }, { type: 'paragraph', text: 'Body' }] };
const lintError = { version: 1, title: 'T', blocks: [{ type: 'image', src: 'missing.png', alt: 'x' }] };

describe('cli usage', () => {
  it('prints help and exits 2 without a command', async () => {
    expect(await runCli([])).toBe(2);
    expect(out.join('\n')).toContain('Usage:');
  });

  it('exits 0 for --help', async () => {
    expect(await runCli(['--help'])).toBe(0);
  });

  it('exits 2 for an unknown command, a missing file argument and an unknown option', async () => {
    expect(await runCli(['publish', 'a.json'])).toBe(2);
    expect(await runCli(['check'])).toBe(2);
    expect(await runCli(['check', 'a.json', '--nope'])).toBe(2);
    expect(err.join('\n')).toContain('unknown command "publish"');
  });
});

describe('cli init', () => {
  it('writes a starter document that passes check, and refuses to overwrite it', async () => {
    const file = join(dir, 'new', 'document.json');
    expect(await runCli(['init', file])).toBe(0);
    expect(await runCli(['check', file])).toBe(0);
    const before = readFileSync(file, 'utf8');
    expect(await runCli(['init', file])).toBe(2);
    expect(readFileSync(file, 'utf8')).toBe(before);
  });
});

describe('cli check', () => {
  it('prints machine-readable issues with --json and exits 1 on lint errors', async () => {
    expect(await runCli(['check', write('bad.json', lintError), '--json'])).toBe(1);
    const report = JSON.parse(out.join('\n'));
    expect(report.ok).toBe(false);
    expect(report.issues[0]).toMatchObject({ code: 'image-missing', severity: 'error', path: '$.blocks[0]' });
  });

  it('reports ok for a valid document', async () => {
    expect(await runCli(['check', write('good.json', valid), '--json'])).toBe(0);
    expect(JSON.parse(out.join('\n'))).toMatchObject({ ok: true, issues: [] });
  });

  it('exits 1 and names the path for a schema error', async () => {
    expect(await runCli(['check', write('schema.json', { ...valid, extra: true })])).toBe(1);
    expect(err.join('\n')).toContain('does not match the document schema');
  });
});

describe('cli build and export', () => {
  it('build writes an HTML preview', async () => {
    const output = join(dir, 'preview.html');
    expect(await runCli(['build', write('good.json', valid), '--output', output])).toBe(0);
    expect(readFileSync(output, 'utf8')).toContain('<h1>T</h1>');
  });

  it('export needs --output', async () => {
    expect(await runCli(['export', write('good.json', valid)])).toBe(2);
  });

  it('export and build stop at lint errors without writing anything', async () => {
    const file = write('bad.json', lintError);
    const docx = join(dir, 'bad.docx');
    const html = join(dir, 'bad.html');
    expect(await runCli(['export', file, '--output', docx])).toBe(1);
    expect(await runCli(['build', file, '--output', html])).toBe(1);
    expect(existsSync(docx)).toBe(false);
    expect(existsSync(html)).toBe(false);
    expect(err.join('\n')).toContain('ERROR image-missing');
  });
});
