// Builds the documentation site from README.md and docs/*.md into site/dist.
// Usage: node build.mjs [--check]  (--check also verifies every internal link)
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(here, 'dist');
const siteUrl = 'https://docforge.gordonkit.com';
const repoBlob = 'https://github.com/gordonkit/docforge/blob/main/';
const check = process.argv.includes('--check');

/** @type {{ source: string, url: string, locale: 'en'|'zh-TW', label: string, group: string }[]} */
const pages = [
  { source: 'README.md', url: '/', locale: 'en', label: 'Overview', group: 'Start' },
  { source: 'docs/cli.md', url: '/docs/cli/', locale: 'en', label: 'CLI', group: 'Use' },
  { source: 'docs/schema.md', url: '/docs/schema/', locale: 'en', label: 'Document schema', group: 'Use' },
  { source: 'docs/templates.md', url: '/docs/templates/', locale: 'en', label: 'Templates', group: 'Use' },
  { source: 'docs/validation.md', url: '/docs/validation/', locale: 'en', label: 'Validation and lint', group: 'Use' },
  { source: 'docs/ai-workflow.md', url: '/docs/ai-workflow/', locale: 'en', label: 'AI authoring workflow', group: 'Use' },
  { source: 'docs/limitations.md', url: '/docs/limitations/', locale: 'en', label: 'Limitations', group: 'Reference' },
  { source: 'docs/architecture.md', url: '/docs/architecture/', locale: 'en', label: 'Architecture', group: 'Reference' },
  { source: 'docs/fidelity.md', url: '/docs/fidelity/', locale: 'en', label: 'Fidelity study', group: 'Reference' },
  { source: 'docs/deploy-site.md', url: '/docs/deploy-site/', locale: 'en', label: 'Deploying this site', group: 'Reference' },
  { source: 'docs/plan.md', url: '/docs/plan/', locale: 'en', label: 'Roadmap', group: 'Reference' },
  { source: 'CHANGELOG.md', url: '/changelog/', locale: 'en', label: 'Changelog', group: 'Reference' },
  { source: 'README.zh-TW.md', url: '/zh-TW/', locale: 'zh-TW', label: '總覽', group: '開始' },
  { source: 'docs/zh-TW/guide.md', url: '/zh-TW/guide/', locale: 'zh-TW', label: '使用指南', group: '開始' },
];
const byRepoPath = new Map(pages.map((page) => [page.source, page]));

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

let currentSource = '';
const marked = new Marked({
  gfm: true,
  walkTokens(token) {
    if (token.type !== 'link' || /^(https?:|mailto:|#)/.test(token.href)) return;
    const [path, hash] = token.href.split('#');
    const target = posix.normalize(posix.join(posix.dirname(currentSource), path));
    const page = byRepoPath.get(target);
    token.href = page ? page.url + (hash ? `#${hash}` : '') : repoBlob + target + (hash ? `#${hash}` : '');
  },
  renderer: {
    heading({ tokens, depth }) {
      const html = this.parser.parseInline(tokens);
      return `<h${depth} id="${slug(html)}">${html}</h${depth}>\n`;
    },
  },
});

function titleOf(markdown) {
  return /^# (.+)$/m.exec(markdown)?.[1]?.replace(/[`*_]/g, '') ?? 'DocForge';
}

function descriptionOf(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => /^[A-Za-z一-鿿]/.test(line) && !line.startsWith('```'));
  const text = (start === -1 ? '' : lines.slice(start).join(' ').split(/\n\s*\n/)[0] ?? '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_>]/g, '').trim();
  const fallback = 'DocForge turns strict JSON into editable Word (DOCX) documents.';
  return (text || fallback).slice(0, 200);
}

function navHtml(page) {
  const own = pages.filter((item) => item.locale === page.locale);
  const groups = [...new Set(own.map((item) => item.group))];
  const sections = groups
    .map((group) => {
      const links = own
        .filter((item) => item.group === group)
        .map((item) => `<a class="item" href="${item.url}"${item.url === page.url ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`)
        .join('');
      return `<h2>${escapeHtml(group)}</h2>${links}`;
    })
    .join('');
  const switcher =
    page.locale === 'en'
      ? '<h2>Language</h2><a class="item" href="/zh-TW/">繁體中文</a>'
      : '<h2>語言</h2><a class="item" href="/">English</a>';
  return `<a class="brand" href="${page.locale === 'en' ? '/' : '/zh-TW/'}">DocForge</a>${sections}${switcher}<h2>Source</h2><a class="item" href="https://github.com/gordonkit/docforge">GitHub</a>`;
}

function pageHtml(page, markdown) {
  currentSource = page.source;
  const body = marked.parse(markdown);
  const title = page.url === '/' ? 'DocForge: editable Word documents from strict JSON' : page.url === '/zh-TW/' ? 'DocForge：用嚴格 JSON 產生可編輯的 Word 文件' : `${titleOf(markdown)} | DocForge`;
  const description = descriptionOf(markdown);
  const alternates =
    page.url === '/' || page.url === '/zh-TW/'
      ? `<link rel="alternate" hreflang="en" href="${siteUrl}/"><link rel="alternate" hreflang="zh-TW" href="${siteUrl}/zh-TW/"><link rel="alternate" hreflang="x-default" href="${siteUrl}/">`
      : '';
  return `<!doctype html>
<html lang="${page.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${siteUrl}${page.url}">
${alternates}
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${siteUrl}${page.url}">
<meta property="og:type" content="website">
<meta name="robots" content="index, follow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div class="layout"><nav>${navHtml(page)}</nav><main>
${body}
<footer>DocForge is published by GordonKit under the Apache License 2.0.</footer>
</main></div>
</body>
</html>
`;
}

const notFound = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | DocForge</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head>
<body><main><h1>Page not found</h1><p><a href="/">Back to the DocForge documentation</a></p></main></body></html>
`;

function llmsText() {
  const list = (locale) =>
    pages
      .filter((page) => page.locale === locale)
      .map((page) => `- [${page.label}](${siteUrl}${page.url})`)
      .join('\n');
  return `# DocForge

> DocForge turns strict JSON into editable Word (DOCX) documents, with lint, previews and export verification. It is built for AI authors and published by GordonKit.

## Documentation

${list('en')}

## 繁體中文

${list('zh-TW')}

## Source

- [GitHub](https://github.com/gordonkit/docforge)
`;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(here, 'public'), dist, { recursive: true });

for (const page of pages) {
  const markdown = (await readFile(join(root, page.source), 'utf8')).replace(/\r\n/g, '\n');
  const target = join(dist, page.url, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, pageHtml(page, markdown), 'utf8');
}
await writeFile(join(dist, '404.html'), notFound, 'utf8');
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${siteUrl}${page.url}</loc></url>`).join('\n')}\n</urlset>\n`,
  'utf8',
);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`, 'utf8');
await writeFile(join(dist, 'llms.txt'), llmsText(), 'utf8');

if (check) {
  const problems = [];
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html')) {
        const html = await readFile(path, 'utf8');
        for (const [, href] of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)) {
          const file = href.endsWith('/') ? join(dist, href, 'index.html') : join(dist, href);
          if (!existsSync(file)) problems.push(`${relative(dist, path)} links to missing ${href}`);
        }
      }
    }
  };
  await walk(dist);
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
}
console.log(`Built ${pages.length} pages into ${relative(process.cwd(), dist) || '.'}`);
