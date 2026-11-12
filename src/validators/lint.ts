import { existsSync, statSync } from 'node:fs';
import { locateImage } from '../images.js';
import type { Block, DocForgeDocument } from '../schemas/document.js';
import { getTemplate, listTemplates } from '../templates/default.js';

export type Severity = 'error' | 'warning' | 'info';

export interface LintIssue {
  /** Stable rule identifier, safe for tools and AI authors to match on. */
  code: string;
  severity: Severity;
  /** JSONPath-like location, e.g. `$.blocks[3]`. */
  path: string;
  message: string;
  /** What to change, phrased for an AI author. */
  fix?: string;
}

export interface LintOptions {
  /** Directory of the document JSON; image paths are resolved against it. */
  baseDir: string;
}

const WIDTH_TOLERANCE = 0.5;
const MAX_COMFORTABLE_COLUMNS = 6;

function plainText(inline: unknown): string {
  if (typeof inline === 'string') return inline;
  if (!Array.isArray(inline)) return '';
  return inline
    .map((run) => (typeof run === 'string' ? run : run && typeof run === 'object' && 'text' in run ? String(run.text) : ''))
    .join('');
}

/** Check content that is valid against the schema but would produce a poor document. */
export function lintDocument(document: DocForgeDocument, options: LintOptions): LintIssue[] {
  const issues: LintIssue[] = [];
  const add = (issue: LintIssue): void => {
    issues.push(issue);
  };

  if (!getTemplate(document.template)) {
    add({
      code: 'unknown-template',
      severity: 'error',
      path: '$.template',
      message: `template "${document.template}" does not exist`,
      fix: `use one of: ${listTemplates().join(', ')}`,
    });
  }

  const headings = document.blocks.flatMap((block, index) => (block.type === 'heading' ? [{ block, index }] : []));
  const h1Count = headings.filter(({ block }) => block.level === 1).length;
  if (h1Count > 1) {
    add({
      code: 'multiple-h1',
      severity: 'warning',
      path: '$.blocks',
      message: `document has ${h1Count} level-1 headings; use one and make the rest level 2`,
      fix: 'keep a single level-1 heading (the document title) and demote the others',
    });
  }
  let previousLevel = 0;
  for (const { block, index } of headings) {
    if (previousLevel > 0 && block.level > previousLevel + 1) {
      add({
        code: 'heading-level-skip',
        severity: 'warning',
        path: `$.blocks[${index}]`,
        message: `heading level jumps from ${previousLevel} to ${block.level}`,
        fix: `use level ${previousLevel + 1}`,
      });
    }
    previousLevel = block.level;
  }

  document.blocks.forEach((block: Block, index) => {
    const path = `$.blocks[${index}]`;
    switch (block.type) {
      case 'paragraph':
      case 'quote':
        if (plainText(block.text).trim() === '') {
          add({ code: 'empty-text', severity: 'warning', path, message: `${block.type} has no visible text`, fix: 'remove the block or add text' });
        }
        break;
      case 'table': {
        const total = block.columns.reduce((sum, column) => sum + column.width, 0);
        if (Math.abs(total - 100) > WIDTH_TOLERANCE) {
          add({
            code: 'table-width-sum',
            severity: 'error',
            path,
            message: `column widths add up to ${total}, expected 100`,
            fix: 'adjust the column widths so they sum to 100',
          });
        }
        if (block.columns.length > MAX_COMFORTABLE_COLUMNS) {
          add({
            code: 'table-too-wide',
            severity: 'warning',
            path,
            message: `table has ${block.columns.length} columns; more than ${MAX_COMFORTABLE_COLUMNS} rarely fit an A4 portrait page`,
            fix: 'split the table or drop columns',
          });
        }
        break;
      }
      case 'image': {
        const location = locateImage(block.src, options.baseDir);
        if (!location.ok && location.reason === 'remote') {
          add({
            code: 'image-remote',
            severity: 'error',
            path,
            message: `image "${block.src}" is not a local file`,
            fix: 'download the image next to the document and use a relative path',
          });
        } else if (!location.ok) {
          add({
            code: 'image-outside-document',
            severity: 'error',
            path,
            message: `image "${block.src}" is outside the folder of the document JSON`,
            fix: 'copy the image into the document folder (or a subfolder) and use a relative path without ".."',
          });
        } else if (!existsSync(location.file) || !statSync(location.file).isFile()) {
          add({
            code: 'image-missing',
            severity: 'error',
            path,
            message: `image file not found: ${block.src}`,
            fix: 'fix the path (relative to the document JSON) or add the file',
          });
        }
        break;
      }
      case 'toc': {
        if (headings.length === 0) {
          add({ code: 'toc-without-headings', severity: 'warning', path, message: 'table of contents but the document has no headings', fix: 'add headings or remove the toc block' });
        }
        break;
      }
      default:
        break;
    }
  });

  const tocCount = document.blocks.filter((block) => block.type === 'toc').length;
  if (tocCount > 1) {
    add({ code: 'multiple-toc', severity: 'warning', path: '$.blocks', message: `document has ${tocCount} tables of contents`, fix: 'keep one toc block' });
  }

  for (const [field, text] of [['header', document.header], ['footer', document.footer]] as const) {
    if (text === undefined) continue;
    const unknown = [...text.matchAll(/\{([^}]*)\}/g)].map((match) => match[1]).filter((name) => name !== 'page' && name !== 'pages');
    if (unknown.length > 0) {
      add({
        code: 'unknown-placeholder',
        severity: 'warning',
        path: `$.${field}`,
        message: `unknown placeholder {${unknown[0]}}; only {page} and {pages} are replaced`,
        fix: 'remove the braces or use {page} / {pages}',
      });
    }
  }

  return issues;
}

export function hasErrors(issues: readonly LintIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}
