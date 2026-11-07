import { isAbsolute, posix, relative, resolve, sep } from 'node:path';
import type { Block, DocForgeDocument, Inline, ListItem, Run } from '../schemas/document.js';
import { type Template, defaultTemplate, templateCss } from '../templates/default.js';

export interface RenderOptions {
  template?: Template;
  /**
   * `export` produces the markup gordon-doc consumes: no embedded CSS (Pandoc would ignore
   * it) and header/footer carried as meta tags. `preview` embeds CSS and shows running
   * text on the page so the HTML is readable in a browser.
   */
  mode: 'export' | 'preview';
  /** Directory of the document JSON; image paths are resolved against it. */
  baseDir: string;
  /** Directory the HTML will be written to; image `src` values are made relative to it. */
  outputDir: string;
}

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Context {
  options: RenderOptions;
  footnotes: string[];
}

function renderRun(run: Run, context: Context): string {
  if (typeof run === 'string') return escapeHtml(run);
  if ('break' in run) return '<br>';
  if ('footnote' in run) {
    context.footnotes.push(run.footnote);
    const n = context.footnotes.length;
    return `<sup><a href="#fn${n}" id="fnref${n}" class="footnote-ref" role="doc-noteref">${n}</a></sup>`;
  }
  let html = escapeHtml(run.text);
  if (run.code) html = `<code>${html}</code>`;
  if (run.sup) html = `<sup>${html}</sup>`;
  if (run.sub) html = `<sub>${html}</sub>`;
  if (run.bold) html = `<strong>${html}</strong>`;
  if (run.italic) html = `<em>${html}</em>`;
  if (run.href) html = `<a href="${escapeHtml(run.href)}">${html}</a>`;
  return html;
}

function renderInline(inline: Inline, context: Context): string {
  return typeof inline === 'string' ? escapeHtml(inline) : inline.map((run) => renderRun(run, context)).join('');
}

function renderListItems(items: Array<string | ListItem>, ordered: boolean, context: Context): string {
  const tag = ordered ? 'ol' : 'ul';
  const body = items
    .map((item) => {
      const normalized: ListItem = typeof item === 'string' ? { text: item } : item;
      const children = normalized.children ? renderListItems(normalized.children, ordered, context) : '';
      return `<li>${renderInline(normalized.text, context)}${children}</li>`;
    })
    .join('');
  return `<${tag}>${body}</${tag}>`;
}

/** Path to an image as it should appear in the HTML written to `outputDir`. */
export function imageSource(src: string, options: Pick<RenderOptions, 'baseDir' | 'outputDir'>): string {
  const absolute = resolve(options.baseDir, src);
  const rel = relative(options.outputDir, absolute);
  if (rel === '' || isAbsolute(rel)) return absolute.split(sep).join(posix.sep);
  return rel.split(sep).join(posix.sep);
}

function renderBlock(block: Block, context: Context): string {
  switch (block.type) {
    case 'heading': {
      const style = block.pageBreakBefore ? ' style="break-before: page"' : '';
      return `<h${block.level}${style}>${escapeHtml(block.text)}</h${block.level}>`;
    }
    case 'paragraph':
      return `<p>${renderInline(block.text, context)}</p>`;
    case 'list':
      return renderListItems(block.items, block.ordered, context);
    case 'table': {
      const cols = block.columns.map((c) => `<col style="width:${c.width}%">`).join('');
      const head = block.columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('');
      const rows = block.rows
        .map((row) => {
          const cells = row.map((cell, index) => {
            const content = renderInline(cell, context);
            return block.headerColumn && index === 0 ? `<td><strong>${content}</strong></td>` : `<td>${content}</td>`;
          });
          return `<tr>${cells.join('')}</tr>`;
        })
        .join('');
      const caption = block.caption ? `<caption>${escapeHtml(block.caption)}</caption>` : '';
      return `<table>${caption}<colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    case 'image': {
      const src = escapeHtml(imageSource(block.src, context.options));
      const width = block.width ? ` width="${block.width}%"` : '';
      const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : '';
      return `<figure><img src="${src}" alt="${escapeHtml(block.alt)}"${width}>${caption}</figure>`;
    }
    case 'quote':
      return `<blockquote><p>${renderInline(block.text, context)}</p></blockquote>`;
    case 'code': {
      const language = block.language ? ` class="language-${escapeHtml(block.language)}"` : '';
      return `<pre><code${language}>${escapeHtml(block.text)}</code></pre>`;
    }
    case 'pageBreak':
      return '<div class="page-break" style="break-before: page"></div>';
    case 'toc': {
      const title = block.title === undefined ? '' : ` data-title="${escapeHtml(block.title)}"`;
      return `<div class="toc" data-depth="${block.depth}"${title}></div>`;
    }
  }
}

/** Render a validated document to HTML. */
export function renderHtml(document: DocForgeDocument, options: RenderOptions): string {
  const template = options.template ?? defaultTemplate;
  const context: Context = { options, footnotes: [] };
  const body = document.blocks.map((block) => renderBlock(block, context)).join('\n');
  const notes = context.footnotes.length
    ? '\n<section class="footnotes" role="doc-endnotes"><hr><ol>' +
      context.footnotes
        .map(
          (text, index) =>
            `<li id="fn${index + 1}"><p>${escapeHtml(text)} <a href="#fnref${index + 1}" class="footnote-back" role="doc-backlink">↩︎</a></p></li>`,
        )
        .join('') +
      '</ol></section>'
    : '';
  const preview = options.mode === 'preview';
  const meta = [
    document.author ? `<meta name="author" content="${escapeHtml(document.author)}">` : '',
    !preview && document.header ? `<meta name="gordon-header" content="${escapeHtml(document.header)}">` : '',
    !preview && document.footer ? `<meta name="gordon-footer" content="${escapeHtml(document.footer)}">` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const display = (text: string): string => escapeHtml(text.replaceAll('{page}', '1').replaceAll('{pages}', 'N'));
  const header = preview && document.header ? `<div class="running header">${display(document.header)}</div>\n` : '';
  const footer = preview && document.footer ? `\n<div class="running footer">${display(document.footer)}</div>` : '';
  const style = preview ? `<style>\n${templateCss(template)}\n</style>` : '';
  return `<!doctype html>
<html lang="${escapeHtml(document.language)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(document.title)}</title>
${meta}
${style}
</head>
<body>
${header}${body}${notes}${footer}
</body>
</html>
`;
}
