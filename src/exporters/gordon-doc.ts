import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';

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

/** Oldest gordon-doc-converter that implements the HTML contract in docs/fidelity.md. */
export const MINIMUM_CONVERTER_VERSION = '1.0.0';

/**
 * Check the output of `gordon-doc version` (for example `gordon-doc 1.0.0`). Releases before
 * 1.0.0 silently drop headers, footers and the table of contents. Output without a version
 * number is accepted: export verification still catches a degraded DOCX.
 */
export function checkConverterVersion(output: string): void {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(output);
  if (match && Number(match[1]) < 1) {
    throw new ToolError(
      `gordon-doc ${match[0]} is too old: DocForge needs gordon-doc-converter ${MINIMUM_CONVERTER_VERSION} or later ` +
        '(pip install --upgrade gordon-doc-converter).',
    );
  }
}

const checked = new Set<string>();

/**
 * Locate the `gordon-doc` CLI: `DOCFORGE_GORDON_DOC` if set, otherwise `gordon-doc` on PATH.
 * Nothing else is searched, so an installed DocForge never runs a program from a folder the
 * user did not choose.
 */
export async function findGordonDoc(): Promise<string> {
  const configured = process.env.DOCFORGE_GORDON_DOC;
  if (configured && !existsSync(configured)) {
    throw new ToolError(`DOCFORGE_GORDON_DOC points to a missing file: ${configured}`);
  }
  const executable = configured || 'gordon-doc';
  if (checked.has(executable)) return executable;
  let version: ToolResult;
  try {
    version = await run(executable, ['version'], 20_000);
  } catch (error) {
    if (configured) throw error;
    throw new ToolError(
      `gordon-doc was not found. Install gordon-doc-converter ${MINIMUM_CONVERTER_VERSION} or later ` +
        '(pip install "gordon-doc-converter[images]") and put gordon-doc on PATH, or set DOCFORGE_GORDON_DOC to its full path.',
    );
  }
  checkConverterVersion(version.stdout);
  checked.add(executable);
  return executable;
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
