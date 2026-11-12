import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ensurePandoc, findGordonDoc } from '../../src/exporters/gordon-doc.js';

/** Set `DOCFORGE_REQUIRE_TOOLS=1` (CI does) to fail instead of skipping when a tool is missing. */
const required = process.env.DOCFORGE_REQUIRE_TOOLS === '1';

/**
 * During development the converter usually lives in a sibling checkout. DocForge itself only
 * looks at `DOCFORGE_GORDON_DOC` and PATH, so the tests point the variable at that checkout.
 */
function useSiblingCheckout(): void {
  if (process.env.DOCFORGE_GORDON_DOC) return;
  const venv = resolve(import.meta.dirname, '..', '..', '..', 'gordon-doc-converter', '.venv');
  const found = [join(venv, 'Scripts', 'gordon-doc.exe'), join(venv, 'bin', 'gordon-doc')].find((path) => existsSync(path));
  if (found) process.env.DOCFORGE_GORDON_DOC = found;
}

/** True when gordon-doc and Pandoc can run. Throws instead when the tools are required. */
export async function exportToolsAvailable(): Promise<boolean> {
  useSiblingCheckout();
  try {
    await findGordonDoc();
    await ensurePandoc();
    return true;
  } catch (error) {
    if (required) throw error;
    return false;
  }
}

/** True when gordon-doc reports a working LibreOffice. Throws instead when the tools are required. */
export async function libreOfficeAvailable(): Promise<boolean> {
  if (!(await exportToolsAvailable())) return false;
  const executable = await findGordonDoc();
  const stdout = await new Promise<string>((done) => {
    execFile(executable, ['doctor', '--json'], { timeout: 60_000, windowsHide: true }, (_error, output) => done(output));
  });
  let available = false;
  try {
    const report = JSON.parse(stdout) as { engines?: Array<{ engine: string; available: boolean }> };
    available = report.engines?.some((engine) => engine.engine === 'libreoffice' && engine.available) ?? false;
  } catch {
    available = false;
  }
  if (!available && required) throw new Error('LibreOffice is required for the preview test but gordon-doc doctor does not report it');
  return available;
}
