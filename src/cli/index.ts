#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ExportError, exportDocx, previewDocx } from '../exporters/docx.js';
import { ToolError } from '../exporters/gordon-doc.js';
import { DocumentError, loadDocument } from '../load.js';
import { renderHtml } from '../renderers/html.js';
import { getTemplate } from '../templates/default.js';
import { hasErrors } from '../validators/lint.js';

const help = `DocForge — editable Word documents from structured content

Usage:
  docforge init [document.json]
  docforge check <document.json> [--json]
  docforge build <document.json> [--output document.html]
  docforge export <document.json> --output document.docx [--overwrite]
  docforge preview <document.json> [--output-dir <directory>] [--engine word-com|libreoffice] [--json]

check validates the schema and lints the content. build writes an HTML preview. export
writes DOCX through gordon-doc (Pandoc required) and verifies the result. preview exports,
then renders PDF and PNG pages. Use --engine word-com for authoritative previews: only Word fills
the table of contents; LibreOffice shows a placeholder.
Set DOCFORGE_GORDON_DOC to the full path of gordon-doc if it is not on PATH.
Exit codes: 0 success, 1 operation/validation failure, 2 invalid CLI usage.`;

class UsageError extends Error {}

const starter = {
  version: 1,
  title: 'Untitled document',
  language: 'en',
  footer: 'Page {page} of {pages}',
  blocks: [
    { type: 'heading', level: 1, text: 'Untitled document' },
    { type: 'paragraph', text: ['Replace this text. Add ', { text: 'bold', bold: true }, ' words and a footnote.', { footnote: 'Footnotes are numbered automatically.' }] },
    { type: 'heading', level: 2, text: 'Section' },
    { type: 'list', ordered: false, items: ['First point', { text: 'Second point', children: ['Nested point'] }] },
    {
      type: 'table',
      columns: [
        { header: 'Item', width: 60 },
        { header: 'Value', width: 40 },
      ],
      rows: [
        ['Alpha', '1'],
        ['Beta', '2'],
      ],
    },
  ],
};

function parseCli() {
  try {
    return parseArgs({
      allowPositionals: true,
      options: {
        output: { type: 'string', short: 'o' },
        'output-dir': { type: 'string' },
        engine: { type: 'string' },
        overwrite: { type: 'boolean' },
        json: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    throw new UsageError((error as Error).message);
  }
}

async function main(): Promise<number> {
  const parsed = parseCli();
  const { values, positionals } = parsed;
  const [command, input] = positionals;
  if (values.help || command === undefined) {
    console.log(help);
    return command === undefined && !values.help ? 2 : 0;
  }

  if (command === 'init') {
    const target = resolve(input ?? 'document.json');
    if (existsSync(target)) throw new UsageError(`${target} already exists`);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(starter, null, 2)}\n`, 'utf8');
    console.log(`Created ${target}`);
    return 0;
  }

  if (!['check', 'build', 'export', 'preview'].includes(command)) throw new UsageError(`unknown command "${command}"`);
  if (input === undefined) throw new UsageError(`${command} needs a document JSON file`);

  const loaded = await loadDocument(input);
  const errors = hasErrors(loaded.issues);

  if (command === 'check') {
    if (values.json) {
      console.log(JSON.stringify({ ok: !errors, file: loaded.file, issues: loaded.issues }, null, 2));
    } else if (loaded.issues.length === 0) {
      console.log(`${loaded.file}: OK`);
    } else {
      for (const issue of loaded.issues) {
        console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}${issue.fix ? ` (${issue.fix})` : ''}`);
      }
    }
    return errors ? 1 : 0;
  }

  if (errors) {
    for (const issue of loaded.issues.filter((item) => item.severity === 'error')) {
      console.error(`ERROR ${issue.code} ${issue.path}: ${issue.message}`);
    }
    console.error('Fix the errors above (run "docforge check") before continuing.');
    return 1;
  }
  for (const issue of loaded.issues) console.error(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`);

  const template = getTemplate(loaded.document.template);
  const stem = basename(loaded.file, extname(loaded.file));

  if (command === 'build') {
    const output = resolve(values.output ?? join(dirname(loaded.file), `${stem}.html`));
    const html = renderHtml(loaded.document, {
      ...(template ? { template } : {}),
      mode: 'preview',
      baseDir: loaded.baseDir,
      outputDir: dirname(output),
    });
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html, 'utf8');
    console.log(`Wrote ${output}`);
    return 0;
  }

  if (command === 'export') {
    if (!values.output) throw new UsageError('export needs --output <file>.docx');
    const result = await exportDocx(loaded.document, {
      baseDir: loaded.baseDir,
      output: values.output,
      overwrite: values.overwrite === true,
    });
    console.log(`Wrote ${result.output}`);
    console.log(`Verified: ${result.verified.length > 0 ? result.verified.join(', ') : 'structure (no optional features used)'}`);
    return 0;
  }

  const result = await previewDocx(loaded.document, {
    baseDir: loaded.baseDir,
    outputDir: values['output-dir'] ?? join(dirname(loaded.file), `${stem}-preview`),
    ...(values.engine ? { engine: values.engine } : {}),
  });
  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Rendered ${result.pages.length} page(s) with ${result.engine}`);
    console.log(`DOCX: ${result.docx}\nPDF:  ${result.pdf}`);
    for (const page of result.pages) console.log(`Page: ${page}`);
  }
  return 0;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    if (error instanceof UsageError) {
      console.error(`${error.message}\n\n${help}`);
      process.exitCode = 2;
    } else if (error instanceof DocumentError) {
      console.error(error.message);
      for (const issue of error.schemaIssues) console.error(`  ${issue.path}: ${issue.message}`);
      process.exitCode = 1;
    } else if (error instanceof ExportError || error instanceof ToolError) {
      console.error(error.message);
      process.exitCode = 1;
    } else {
      console.error(error);
      process.exitCode = 1;
    }
  },
);
