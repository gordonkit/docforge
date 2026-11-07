/**
 * Design tokens for a document template. In the MVP the tokens drive the HTML preview
 * (`docforge build`). DOCX styling comes from gordon-doc-converter's reference document,
 * so DOCX output does not change with these values yet (see docs/limitations.md).
 */
export interface Template {
  name: string;
  fonts: { body: string; heading: string; mono: string };
  /** Sizes in points. */
  sizes: { body: number; h1: number; h2: number; h3: number; h4: number; code: number };
  colors: { text: string; heading: string; muted: string; link: string; border: string; tableHeader: string };
  /** Page margin in millimetres. */
  pageMarginMm: number;
}

const cjkStack = '"Noto Sans CJK TC", "Noto Sans TC", "Microsoft JhengHei", "PingFang TC"';

export const defaultTemplate: Template = {
  name: 'default',
  fonts: {
    body: `"Segoe UI", ${cjkStack}, sans-serif`,
    heading: `"Segoe UI", ${cjkStack}, sans-serif`,
    mono: 'Consolas, "Cascadia Mono", monospace',
  },
  sizes: { body: 10.5, h1: 22, h2: 16, h3: 13, h4: 11, code: 10 },
  colors: {
    text: '#111827',
    heading: '#1f4e79',
    muted: '#6b7280',
    link: '#1d4ed8',
    border: '#bfc5cd',
    tableHeader: '#f1f3f5',
  },
  pageMarginMm: 20,
};

const templates: Record<string, Template> = { default: defaultTemplate };

export function listTemplates(): string[] {
  return Object.keys(templates);
}

export function getTemplate(name: string): Template | undefined {
  return templates[name];
}

/** Print-style CSS for the HTML preview. */
export function templateCss(template: Template): string {
  const { fonts, sizes, colors } = template;
  return `@page { size: A4; margin: ${template.pageMarginMm}mm; }
body { margin: 0 auto; max-width: ${210 - template.pageMarginMm * 2}mm; padding: ${template.pageMarginMm}mm; box-sizing: content-box;
  color: ${colors.text}; font-family: ${fonts.body}; font-size: ${sizes.body}pt; line-height: 1.5; }
h1, h2, h3, h4 { font-family: ${fonts.heading}; color: ${colors.heading}; line-height: 1.3; break-after: avoid; }
h1 { font-size: ${sizes.h1}pt; } h2 { font-size: ${sizes.h2}pt; } h3 { font-size: ${sizes.h3}pt; } h4 { font-size: ${sizes.h4}pt; font-style: italic; }
a { color: ${colors.link}; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 1em 0; }
th, td { border: 1px solid ${colors.border}; padding: 2pt 5pt; vertical-align: top; text-align: left; }
th { background: ${colors.tableHeader}; }
caption { caption-side: top; text-align: left; color: ${colors.muted}; font-size: 0.9em; padding-bottom: 4pt; }
figure { margin: 1em 0; } img { max-width: 100%; height: auto; }
figcaption { color: ${colors.muted}; font-size: 0.9em; font-style: italic; }
blockquote { margin: 1em 0 1em 1.5em; color: ${colors.muted}; }
pre { background: #f3f4f6; padding: 6pt 8pt; font-family: ${fonts.mono}; font-size: ${sizes.code}pt; white-space: pre-wrap; }
code { font-family: ${fonts.mono}; font-size: ${sizes.code}pt; }
.toc { border: 1px dashed ${colors.border}; padding: 6pt 10pt; color: ${colors.muted}; }
.toc::before { content: "Table of contents (filled in by Word)"; }
.page-break { border-top: 2px dashed ${colors.border}; margin: 2em 0; }
.running { color: ${colors.muted}; font-size: 8pt; border-bottom: 1px solid ${colors.border}; margin-bottom: 1em; }
.running.footer { border: 0; border-top: 1px solid ${colors.border}; margin-top: 2em; text-align: center; }
.footnotes { font-size: 0.9em; color: ${colors.muted}; }`;
}
