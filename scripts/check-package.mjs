#!/usr/bin/env node
// Packs DocForge as npm would publish it, installs the tarball into a new project, and uses it
// the way a user would. Run with `npm run test:package`. With DOCFORGE_REQUIRE_TOOLS=1 it also
// exports a DOCX, which needs Pandoc and gordon-doc.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const npmCli = process.env.npm_execpath;
if (!npmCli?.endsWith('.js')) throw new Error('Run this through npm: npm run test:package');
const { name } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function run(command, args, cwd) {
  const result = spawnSync(process.execPath, [command, ...args], { cwd, encoding: 'utf8', timeout: 600_000 });
  if (result.status !== 0) {
    throw new Error(`${[command, ...args].join(' ')} exited ${result.status}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

function check(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`ok - ${message}`);
}

const work = mkdtempSync(join(tmpdir(), 'docforge-package-'));
try {
  // Build first, then pack without prepack, whose build output would mix with pack's JSON.
  run(npmCli, ['run', 'build'], root);
  const [packed] = JSON.parse(run(npmCli, ['pack', '--json', '--ignore-scripts', '--pack-destination', work], root));
  const files = new Set(packed.files.map((file) => file.path));
  for (const file of ['dist/cli/index.js', 'dist/cli/run.js', 'dist/index.js', 'dist/index.d.ts', 'examples/report.json',
    'examples/assets/small.png', 'LICENSE', 'NOTICE', 'THIRD_PARTY_NOTICES.md', 'README.md']) {
    check(files.has(file), `the package contains ${file}`);
  }
  for (const prefix of ['src/', 'tests/', 'site/', 'docs/', 'scripts/', 'spikes/', '.github/']) {
    check(![...files].some((file) => file.startsWith(prefix)), `the package leaves out ${prefix}`);
  }

  // A user's project that installs the tarball as published.
  writeFileSync(join(work, 'package.json'), JSON.stringify({ name: 'docforge-package-check', private: true, type: 'module' }));
  run(npmCli, ['install', '--no-audit', '--no-fund', join(work, packed.filename)], work);
  const installed = join(work, 'node_modules', ...name.split('/'));
  check(existsSync(join(installed, 'dist', 'cli', 'index.js')), `${name} is installed`);
  check(existsSync(join(work, 'node_modules', '.bin', process.platform === 'win32' ? 'docforge.cmd' : 'docforge')), 'the docforge bin is linked');

  const cli = join(installed, 'dist', 'cli', 'index.js');
  check(run(cli, ['--help'], work).includes('docforge init'), 'the CLI prints help');
  writeFileSync(join(work, 'api.mjs'), `import { listTemplates, parseDocument } from '${name}';\n`
    + "const parsed = parseDocument({ version: 1, title: 'T', blocks: [{ type: 'paragraph', text: 'x' }] });\n"
    + 'console.log(JSON.stringify({ templates: listTemplates(), ok: parsed.ok }));\n');
  const api = JSON.parse(run(join(work, 'api.mjs'), [], work));
  check(api.ok && api.templates.includes('default'), 'the package root can be imported');

  const document = join(work, 'doc', 'document.json');
  run(cli, ['init', document], work);
  check(JSON.parse(run(cli, ['check', document, '--json'], work)).ok, 'init writes a document that passes check');
  run(cli, ['build', document], work);
  check(readFileSync(join(work, 'doc', 'document.html'), 'utf8').includes('<h1>'), 'build writes the HTML preview');
  const example = join(installed, 'examples', 'report.json');
  check(JSON.parse(run(cli, ['check', example, '--json'], work)).ok, 'the shipped example passes check');

  if (process.env.DOCFORGE_REQUIRE_TOOLS === '1') {
    const output = join(work, 'report.docx');
    check(run(cli, ['export', example, '--output', output], work).includes('Verified: header, footer, toc, footnotes, images, page-breaks, template'),
      'the shipped example exports a verified DOCX');
  } else {
    console.log('skipped - DOCX export (set DOCFORGE_REQUIRE_TOOLS=1 with Pandoc and gordon-doc on PATH)');
  }
  console.log(`\n${packed.filename}: ${packed.files.length} files, ${(packed.size / 1024).toFixed(0)} kB packed`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
