/**
 * Design tokens for a document template. The tokens drive both the HTML preview
 * (`docforge build`) and the DOCX styles (applied after conversion by
 * `src/exporters/style.ts`).
 */
export interface Template {
  name: string;
  description: string;
  /** CSS font stacks for the HTML preview. */
  fonts: { body: string; heading: string; mono: string };
  /** Single installed font names written into the DOCX. */
  docxFonts: { body: string; heading: string; eastAsia: string };
  /** Sizes in points. */
  sizes: { body: number; h1: number; h2: number; h3: number; h4: number; code: number };
  colors: { text: string; heading: string; muted: string; link: string; border: string; tableHeader: string };
  /** Page margin in millimetres. */
  pageMarginMm: number;
}

const cjkStack = '"Noto Sans CJK TC", "Noto Sans TC", "Microsoft JhengHei", "PingFang TC"';
const cjkSerifStack = '"Noto Serif CJK TC", "Noto Serif TC", "PMingLiU", "Songti TC"';
const mono = 'Consolas, "Cascadia Mono", monospace';

export const defaultTemplate: Template = {
  name: 'default',
  description: 'Clean sans-serif report with blue headings.',
  fonts: { body: `"Segoe UI", ${cjkStack}, sans-serif`, heading: `"Segoe UI", ${cjkStack}, sans-serif`, mono },
  docxFonts: { body: 'Segoe UI', heading: 'Segoe UI', eastAsia: 'Microsoft JhengHei' },
  sizes: { body: 10.5, h1: 22, h2: 16, h3: 13, h4: 11, code: 10 },
  colors: { text: '#111827', heading: '#1f4e79', muted: '#6b7280', link: '#1d4ed8', border: '#bfc5cd', tableHeader: '#f1f3f5' },
  pageMarginMm: 20,
};

export const classicTemplate: Template = {
  name: 'classic',
  description: 'Serif, black headings and generous margins for formal documents.',
  fonts: { body: `Georgia, "Times New Roman", ${cjkSerifStack}, serif`, heading: `Georgia, "Times New Roman", ${cjkSerifStack}, serif`, mono },
  docxFonts: { body: 'Georgia', heading: 'Georgia', eastAsia: 'PMingLiU' },
  sizes: { body: 11.5, h1: 24, h2: 17, h3: 14, h4: 12, code: 10 },
  colors: { text: '#000000', heading: '#000000', muted: '#555555', link: '#1a0dab', border: '#999999', tableHeader: '#e8e8e8' },
  pageMarginMm: 25,
};

export const compactTemplate: Template = {
  name: 'compact',
  description: 'Dense sans-serif with teal headings and narrow margins for dense reference material.',
  fonts: { body: `Calibri, ${cjkStack}, sans-serif`, heading: `Calibri, ${cjkStack}, sans-serif`, mono },
  docxFonts: { body: 'Calibri', heading: 'Calibri', eastAsia: 'Microsoft JhengHei' },
  sizes: { body: 9.5, h1: 18, h2: 14, h3: 11.5, h4: 10, code: 9 },
  colors: { text: '#1f2933', heading: '#0f766e', muted: '#52606d', link: '#0f766e', border: '#cbd2d9', tableHeader: '#e6f4f1' },
  pageMarginMm: 15,
};

export const minutesTemplate: Template = {
  name: 'minutes',
  description: 'Plain and tight meeting minutes with slate headings.',
  fonts: { body: `Arial, ${cjkStack}, sans-serif`, heading: `Arial, ${cjkStack}, sans-serif`, mono },
  docxFonts: { body: 'Arial', heading: 'Arial', eastAsia: 'Microsoft JhengHei' },
  sizes: { body: 10, h1: 18, h2: 13, h3: 11, h4: 10, code: 9 },
  colors: { text: '#1f2937', heading: '#334155', muted: '#64748b', link: '#2563eb', border: '#cbd5e1', tableHeader: '#e2e8f0' },
  pageMarginMm: 18,
};

export const proposalTemplate: Template = {
  name: 'proposal',
  description: 'Confident navy headings and large titles for proposals.',
  fonts: { body: `Calibri, ${cjkStack}, sans-serif`, heading: `"Segoe UI Semibold", "Segoe UI", ${cjkStack}, sans-serif`, mono },
  docxFonts: { body: 'Calibri', heading: 'Segoe UI Semibold', eastAsia: 'Microsoft JhengHei' },
  sizes: { body: 11, h1: 28, h2: 18, h3: 14, h4: 12, code: 10 },
  colors: { text: '#1a202c', heading: '#1e3a8a', muted: '#64748b', link: '#1d4ed8', border: '#c7d2fe', tableHeader: '#e0e7ff' },
  pageMarginMm: 22,
};

export const letterTemplate: Template = {
  name: 'letter',
  description: 'Understated serif letter with small black headings and wide margins.',
  fonts: { body: `"Times New Roman", ${cjkSerifStack}, serif`, heading: `"Times New Roman", ${cjkSerifStack}, serif`, mono },
  docxFonts: { body: 'Times New Roman', heading: 'Times New Roman', eastAsia: 'PMingLiU' },
  sizes: { body: 12, h1: 16, h2: 14, h3: 12, h4: 12, code: 10 },
  colors: { text: '#000000', heading: '#000000', muted: '#444444', link: '#000000', border: '#888888', tableHeader: '#eeeeee' },
  pageMarginMm: 28,
};

const templates: Record<string, Template> = {
  default: defaultTemplate,
  classic: classicTemplate,
  compact: compactTemplate,
  minutes: minutesTemplate,
  proposal: proposalTemplate,
  letter: letterTemplate,
};

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
