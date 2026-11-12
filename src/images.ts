import { existsSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export type ImageLocation =
  | { ok: true; file: string }
  | { ok: false; reason: 'remote' | 'outside' };

const real = (path: string): string => (existsSync(path) ? realpathSync(path) : path);

/**
 * Resolve an image `src` against the directory of the document JSON.
 *
 * Document JSON is untrusted (it is usually written by an AI), and every image it names is
 * embedded in the DOCX. Only files inside the document's own directory tree are allowed, so
 * a document cannot pull in arbitrary files from the machine that exports it. Symbolic links
 * are followed before the check.
 */
export function locateImage(src: string, baseDir: string): ImageLocation {
  if (/^[a-z][a-z0-9+.-]*:/i.test(src)) return { ok: false, reason: 'remote' };
  if (isAbsolute(src)) return { ok: false, reason: 'outside' };
  const file = resolve(baseDir, src);
  const rel = relative(real(resolve(baseDir)), real(file));
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return { ok: false, reason: 'outside' };
  return { ok: true, file };
}
