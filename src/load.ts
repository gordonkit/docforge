import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { type DocForgeDocument, type SchemaIssue, parseDocument } from './schemas/document.js';
import { type LintIssue, lintDocument } from './validators/lint.js';

export interface LoadedDocument {
  file: string;
  baseDir: string;
  document: DocForgeDocument;
  issues: LintIssue[];
}

export class DocumentError extends Error {
  constructor(
    message: string,
    readonly schemaIssues: SchemaIssue[] = [],
  ) {
    super(message);
  }
}

/** Read a document JSON file, validate it against the schema, and lint it. */
export async function loadDocument(path: string): Promise<LoadedDocument> {
  const file = resolve(path);
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch {
    throw new DocumentError(`cannot read ${file}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new DocumentError(`${file} is not valid JSON: ${(error as Error).message}`);
  }
  const parsed = parseDocument(json);
  if (!parsed.ok) throw new DocumentError(`${file} does not match the document schema`, parsed.issues);
  const baseDir = dirname(file);
  return { file, baseDir, document: parsed.document, issues: lintDocument(parsed.document, { baseDir }) };
}
