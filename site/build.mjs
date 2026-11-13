// Builds the documentation site from README.md and docs/*.md into site/dist.
// Usage: node build.mjs [--check]  (--check also verifies every internal link)
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(here, 'dist');
const siteUrl = 'https://docforge.gordonkit.com';
const repoBlob = 'https://github.com/gordonkit/docforge/blob/main/';
const check = process.argv.includes('--check');

// `description` replaces the one taken from the page's first paragraph, for a page that opens with a list.
/** @type {{ source: string, url: string, locale: 'en'|'zh-TW', label: string, group: string, description?: string }[]} */
const pages = [
  { source: 'README.md', url: '/', locale: 'en', label: 'Overview', group: 'Start' },
  { source: 'docs/cli.md', url: '/docs/cli/', locale: 'en', label: 'CLI', group: 'Use' },
  { source: 'docs/schema.md', url: '/docs/schema/', locale: 'en', label: 'Document schema', group: 'Use' },
  { source: 'docs/templates.md', url: '/docs/templates/', locale: 'en', label: 'Templates', group: 'Use' },
  { source: 'docs/validation.md', url: '/docs/validation/', locale: 'en', label: 'Validation and lint', group: 'Use' },
  { source: 'docs/ai-workflow.md', url: '/docs/ai-workflow/', locale: 'en', label: 'AI authoring workflow', group: 'Use', description: 'The steps an AI author follows to produce a DocForge document: write strict JSON, check it, preview the pages, then export the DOCX.' },
  { source: 'docs/limitations.md', url: '/docs/limitations/', locale: 'en', label: 'Limitations', group: 'Reference' },
  { source: 'docs/architecture.md', url: '/docs/architecture/', locale: 'en', label: 'Architecture', group: 'Reference' },
  { source: 'docs/fidelity.md', url: '/docs/fidelity/', locale: 'en', label: 'Fidelity study', group: 'Reference' },
  { source: 'docs/deploy-site.md', url: '/docs/deploy-site/', locale: 'en', label: 'Deploying this site', group: 'Reference' },
  { source: 'docs/plan.md', url: '/docs/plan/', locale: 'en', label: 'Roadmap', group: 'Reference' },
  { source: 'CHANGELOG.md', url: '/changelog/', locale: 'en', label: 'Changelog', group: 'Reference' },
  { source: 'README.zh-TW.md', url: '/zh-TW/', locale: 'zh-TW', label: '總覽', group: '開始' },
  { source: 'docs/zh-TW/guide.md', url: '/zh-TW/guide/', locale: 'zh-TW', label: '使用指南', group: '開始' },
];
// Last modification date (YYYY-MM-DD) of a source file: its last git commit, else the file's mtime.
const lastModified = (source) => {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', source], { cwd: root, encoding: 'utf8' }).trim();
    if (iso) return iso.slice(0, 10);
  } catch {}
  return statSync(join(root, source)).mtime.toISOString().slice(0, 10);
};
const byRepoPath = new Map(pages.map((page) => [page.source, page]));

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

const repoUrl = 'https://github.com/gordonkit/docforge';
const locales = [
  { value: 'en', short: 'EN', label: 'English', home: '/' },
  { value: 'zh-TW', short: '繁中', label: '繁體中文', home: '/zh-TW/' },
];
const labels = {
  en: { search: 'Search documentation', close: 'Close search', onPage: 'On this page', menu: 'Open navigation', copy: 'Copy code', copied: 'Copied', previous: 'Previous', next: 'Next', results: 'Search results', noResults: 'No matching documentation', license: 'Apache License 2.0', notices: 'Third-party notices', language: 'Change language', theme: 'Toggle theme', parent: 'A GordonKit project:' },
  'zh-TW': { search: '搜尋文件', close: '關閉搜尋', onPage: '本頁內容', menu: '開啟導覽', copy: '複製程式碼', copied: '已複製', previous: '上一頁', next: '下一頁', results: '搜尋結果', noResults: '找不到符合的文件', license: 'Apache 2.0 授權', notices: '第三方授權聲明', language: '切換語言', theme: '切換主題', parent: 'GordonKit 旗下網站：' },
};

// Heroicons 24 outline paths (MIT), the icon set the SlideForge documentation site uses.
const iconPaths = {
  bars: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  check: 'm4.5 12.75 6 6 9-13.5',
  chevronDown: 'm19.5 8.25-7.5 7.5-7.5-7.5',
  chevronLeft: 'M15.75 19.5 8.25 12l7.5-7.5',
  chevronRight: 'm8.25 4.5 7.5 7.5-7.5 7.5',
  clipboard: 'M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z',
  code: 'M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5',
  document: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
  language: 'm10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802',
  search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  moon: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
  sun: 'M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
  close: 'M6 18 18 6M6 6l12 12',
};
const icon = (name, extra = '') =>
  `<svg class="icon${extra ? ` ${extra}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="${iconPaths[name]}"/></svg>`;

let currentSource = '';
let currentLocale = 'en';
/** @type {{ id: string, text: string }[]} */
let currentToc = [];
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
      const id = slug(html);
      if (depth === 2) currentToc.push({ id, text: html.replace(/<[^>]+>/g, '') });
      return `<h${depth} id="${id}">${html}</h${depth}>\n`;
    },
    code({ text, lang }) {
      const t = labels[currentLocale];
      const language = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      return `<div class="code"><button class="copy" type="button" data-copied="${t.copied}">${icon('clipboard', 'small')}<span>${t.copy}</span></button><pre><code${language}>${escapeHtml(text)}</code></pre></div>\n`;
    },
  },
});

function titleOf(markdown) {
  return /^# (.+)$/m.exec(markdown)?.[1]?.replace(/[`*_]/g, '') ?? 'DocForge';
}

function descriptionOf(markdown) {
  // The first prose paragraph: lines from the first one that starts with a letter, outside a
  // code fence, up to the next blank line.
  const paragraph = [];
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      if (paragraph.length > 0) break;
      fenced = !fenced;
    } else if (paragraph.length > 0) {
      if (line.trim() === '') break;
      paragraph.push(line.trim());
    } else if (!fenced && /^[A-Za-z一-鿿]/.test(line)) {
      paragraph.push(line.trim());
    }
  }
  const text = paragraph.join(' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').trim();
  return shorten(text || 'DocForge turns strict JSON into editable Word (DOCX) documents.', 200);
}

/** Cuts at the last sentence end within the limit, or else at a word or clause break with an ellipsis. */
function shorten(text, limit) {
  if (text.length <= limit) return text;
  const head = text.slice(0, limit);
  const sentence = Math.max(head.lastIndexOf('. '), head.lastIndexOf('。'), head.lastIndexOf(': '), head.lastIndexOf('：'));
  if (sentence >= limit / 2) return head.slice(0, sentence + 1).replace(/[:：]$/, '.').trim();
  const clause = Math.max(head.lastIndexOf(' ', limit - 2), head.lastIndexOf('，', limit - 2), head.lastIndexOf('、', limit - 2));
  return `${head.slice(0, clause > 0 ? clause : limit - 1).replace(/[\s,;:，、；：]+$/, '')}…`;
}

const logo = 'DocForge <span>Docs</span>';

// The same @id values gordonkit.com uses for its Organization and for this site, so the two
// entity graphs join.
const parentOrganization = { id: 'https://gordonkit.com/#organization', name: 'GordonKit', url: 'https://gordonkit.com/' };
const websiteId = `${siteUrl}/#website`;

function structuredData(page, headline, description) {
  const publisher = { '@id': parentOrganization.id };
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': parentOrganization.id, name: parentOrganization.name, url: parentOrganization.url },
      { '@type': 'WebSite', '@id': websiteId, name: 'DocForge Documentation', url: `${siteUrl}/`, publisher },
      {
        '@type': 'TechArticle',
        headline,
        description,
        inLanguage: page.locale,
        url: `${siteUrl}${page.url}`,
        isPartOf: { '@id': websiteId },
        publisher,
        about: {
          // codeRepository belongs to SoftwareSourceCode, not SoftwareApplication; the package is both.
          '@type': ['SoftwareApplication', 'SoftwareSourceCode'],
          name: 'DocForge',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Windows, Linux, macOS',
          codeRepository: repoUrl,
          publisher,
        },
      },
    ],
  }).replaceAll('<', '\\u003c');
}

function navHtml(page) {
  const own = pages.filter((item) => item.locale === page.locale);
  return [...new Set(own.map((item) => item.group))]
    .map((group) => {
      const links = own
        .filter((item) => item.group === group)
        .map((item) => `<a href="${item.url}"${item.url === page.url ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`)
        .join('');
      return `<div class="nav-group"><p>${escapeHtml(group)}</p>${links}</div>`;
    })
    .join('');
}

function headerHtml(page) {
  const t = labels[page.locale];
  const current = locales.find((item) => item.value === page.locale);
  const options = locales
    .map((item) => `<a role="menuitemradio" aria-checked="${item === current}" lang="${item.value}" href="${item.home}">${item.label}${item === current ? icon('check', 'small') : ''}</a>`)
    .join('');
  return `<header class="topbar"><div class="topbar-inner">
<button class="menu-button" type="button" data-menu-open aria-label="${t.menu}">${icon('bars')}</button>
<a class="logo" href="${current.home}">${logo}</a>
<button class="search-button" type="button" data-search-open>${icon('search', 'small')}<span>${t.search}</span></button>
<div class="tools">
<div class="locale"><button class="icon-button" type="button" aria-label="${t.language}" aria-haspopup="menu" aria-expanded="false">${icon('language')}<span class="short">${current.short}</span>${icon('chevronDown', 'tiny chevron')}</button><div class="locale-menu" role="menu" aria-label="${t.language}" hidden>${options}</div></div>
<button class="icon-button theme-toggle" type="button" data-theme-toggle aria-label="${t.theme}">${icon('sun', 'sun')}${icon('moon', 'moon')}</button>
<a class="icon-button" href="${repoUrl}" aria-label="GitHub">${icon('code')}</a>
</div>
</div></header>`;
}

function pagerHtml(page) {
  const t = labels[page.locale];
  const own = pages.filter((item) => item.locale === page.locale);
  const index = own.indexOf(page);
  const previous = own[index - 1];
  const next = own[index + 1];
  if (!previous && !next) return '';
  const link = (item, direction, label) => {
    const text = `<span><small>${label}</small><strong>${escapeHtml(item.label)}</strong></span>`;
    return `<a class="${direction}" href="${item.url}">${direction === 'previous' ? icon('chevronLeft') + text : text + icon('chevronRight')}</a>`;
  };
  return `<nav class="pager">${previous ? link(previous, 'previous', t.previous) : '<span></span>'}${next ? link(next, 'next', t.next) : ''}</nav>`;
}

function pageHtml(page, markdown) {
  currentSource = page.source;
  currentLocale = page.locale;
  currentToc = [];
  const t = labels[page.locale];
  const eyebrow = `<p class="eyebrow">${icon('document', 'small')}${escapeHtml(page.group)}</p>`;
  // The title and the paragraph after it form the page head, as on the SlideForge site.
  const body = marked
    .parse(markdown)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>')
    .replace(/^(<h1[^>]*>[\s\S]*?<\/h1>\n(?:<p>[\s\S]*?<\/p>\n)?)/, (head) => `<div class="page-head">${eyebrow}${head}</div>\n`);
  const toc = currentToc.map((item) => `<a href="#${item.id}">${item.text}</a>`).join('');
  const title = page.url === '/' ? 'DocForge: editable Word documents from strict JSON' : page.url === '/zh-TW/' ? 'DocForge：用嚴格 JSON 產生可編輯的 Word 文件' : `${titleOf(markdown)} | DocForge`;
  const description = page.description ?? descriptionOf(markdown);
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
<meta property="og:image" content="${siteUrl}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${siteUrl}/og-image.png">
<meta name="robots" content="index, follow">
<script type="application/ld+json">${structuredData(page, titleOf(markdown), description)}</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
<script src="/site.js"></script>
</head>
<body>
${headerHtml(page)}
<aside class="sidebar"><div class="sidebar-head"><span class="logo">${logo}</span><button class="icon-button" type="button" data-menu-close aria-label="${t.close}">${icon('close')}</button></div><nav>${navHtml(page)}</nav></aside>
<button class="overlay" type="button" data-menu-close aria-label="${t.close}" hidden></button>
<main><article>
${body}${pagerHtml(page)}
</article>
<footer class="site-footer"><a href="${repoBlob}LICENSE">${t.license}</a><a href="${repoBlob}THIRD_PARTY_NOTICES.md">${t.notices}</a><span>${t.parent} <a href="https://gordonkit.com/${page.locale}/">gordonkit.com</a></span></footer>
</main>
${toc ? `<aside class="toc"><p>${t.onPage}</p><nav>${toc}</nav></aside>` : ''}
<div class="search" role="dialog" aria-modal="true" aria-label="${t.search}" data-results="${t.results}" data-empty="${t.noResults}" hidden><div class="search-panel"><div class="search-field">${icon('search')}<input type="search" placeholder="${t.search}" aria-label="${t.search}"><button class="icon-button" type="button" data-search-close aria-label="${t.close}">${icon('close')}</button></div><div class="search-results"></div></div></div>
</body>
</html>
`;
}

const notFound = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page not found | DocForge</title><meta name="robots" content="noindex"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"><script src="/site.js"></script></head>
<body><main class="plain"><h1>Page not found</h1><p><a href="/">Back to the DocForge documentation</a></p></main></body></html>
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

const unescapeHtml = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const searchIndex = [];
for (const page of pages) {
  const markdown = (await readFile(join(root, page.source), 'utf8')).replace(/\r\n/g, '\n');
  const target = join(dist, page.url, 'index.html');
  await mkdir(dirname(target), { recursive: true });
  const html = pageHtml(page, markdown);
  await writeFile(target, html, 'utf8');
  const article = html.slice(html.indexOf('<article>'), html.includes('<nav class="pager">') ? html.indexOf('<nav class="pager">') : html.indexOf('</article>'));
  searchIndex.push({
    locale: page.locale,
    url: page.url,
    title: page.label,
    summary: page.description ?? descriptionOf(markdown),
    text: unescapeHtml(`${page.label} ${article.replace(/<button[\s\S]*?<\/button>/g, '').replace(/<[^>]+>/g, ' ')}`).replace(/\s+/g, ' ').toLowerCase(),
  });
}
await writeFile(join(dist, 'search-index.json'), JSON.stringify(searchIndex), 'utf8');
await writeFile(join(dist, '404.html'), notFound, 'utf8');
await writeFile(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${siteUrl}${page.url}</loc><lastmod>${lastModified(page.source)}</lastmod></url>`).join('\n')}\n</urlset>\n`,
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
