import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** A failure to run an external conversion tool, with an actionable message. */
export class ToolError extends Error {}

export interface ToolResult {
  stdout: string;
  stderr: string;
}

function run(command: string, args: string[], timeoutMs: number): Promise<ToolResult> {
  return new Promise((resolvePromise, reject) => {
    execFile(command, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const detail = (stderr || stdout || error.message).trim().split('\n').slice(-3).join(' | ');
        reject(new ToolError(`${command} failed: ${detail}`));
      } else {
        resolvePromise({ stdout, stderr });
      }
    });
  });
}

/**
 * Locate the `gordon-doc` CLI: `DOCFORGE_GORDON_DOC`, then `gordon-doc` on PATH, then the
 * sibling `gordon-doc-converter` checkout used during development.
 */
export async function findGordonDoc(): Promise<string> {
  const configured = process.env.DOCFORGE_GORDON_DOC;
  if (configured) {
    if (!existsSync(configured)) throw new ToolError(`DOCFORGE_GORDON_DOC points to a missing file: ${configured}`);
    return configured;
  }
  try {
    await run('gordon-doc', ['version'], 20_000);
    return 'gordon-doc';
  } catch {
    // fall through to the development checkout
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const sibling = resolve(root, '..', 'gordon-doc-converter', '.venv');
  for (const candidate of [join(sibling, 'Scripts', 'gordon-doc.exe'), join(sibling, 'bin', 'gordon-doc')]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new ToolError(
    'gordon-doc was not found. Install gordon-doc-converter (pip install gordon-doc-converter[word,images]) ' +
      'and put gordon-doc on PATH, or set DOCFORGE_GORDON_DOC to its full path.',
  );
}

/**
 * Pandoc is required for faithful DOCX output. Without it gordon-doc silently falls back to
 * another engine that drops headers, footers, tables of contents and page breaks, so
 * DocForge refuses to continue instead of producing a degraded file.
 */
export async function ensurePandoc(): Promise<void> {
  try {
    await run('pandoc', ['--version'], 20_000);
  } catch {
    throw new ToolError('Pandoc was not found on PATH. Install Pandoc (https://pandoc.org/installing.html) and retry.');
  }
}

export async function runGordonDoc(args: string[], timeoutMs = 180_000): Promise<ToolResult> {
  const executable = await findGordonDoc();
  return run(executable, args, timeoutMs);
}
