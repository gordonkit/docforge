import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { Template } from '../templates/default.js';

const hex = (color: string): string => color.replace('#', '').toUpperCase();
const halfPoints = (points: number): string => String(Math.round(points * 2));

function runProperties(fonts: { latin: string; eastAsia: string }, size: number, color: string, original: string): string {
  const rest = original.replace(/<w:(rFonts|color|sz|szCs)\b[^>]*\/>/g, '').trim();
  return (
    `<w:rFonts w:ascii="${fonts.latin}" w:hAnsi="${fonts.latin}" w:cs="${fonts.latin}" w:eastAsia="${fonts.eastAsia}" />` +
    rest +
    `<w:color w:val="${hex(color)}" /><w:sz w:val="${halfPoints(size)}" /><w:szCs w:val="${halfPoints(size)}" />`
  );
}

/** Replace the <w:rPr> of one style, creating it when the style has none. */
function patchStyle(xml: string, styleId: string, build: (original: string) => string): string {
  const pattern = new RegExp(`(<w:style\\b[^>]*w:styleId="${styleId}"[^>]*>)([\\s\\S]*?)(</w:style>)`);
  const match = pattern.exec(xml);
  if (!match) return xml;
  const [, open, body, close] = match as unknown as [string, string, string, string];
  const rPr = /<w:rPr\s*\/>|<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(body);
  const next = rPr
    ? body.replace(rPr[0], `<w:rPr>${build(rPr[1] ?? '')}</w:rPr>`)
    : `${body}<w:rPr>${build('')}</w:rPr>`;
  return xml.replace(match[0], `${open}${next}${close}`);
}

/** Write the template tokens into styles.xml and the page margins into document.xml. */
export function applyTemplateToParts(stylesXml: string, documentXml: string, template: Template): { styles: string; document: string } {
  const { docxFonts, sizes, colors } = template;
  const body = { latin: docxFonts.body, eastAsia: docxFonts.eastAsia };
  const heading = { latin: docxFonts.heading, eastAsia: docxFonts.eastAsia };

  let styles = stylesXml.replace(
    /<w:rPrDefault>[\s\S]*?<\/w:rPrDefault>/,
    `<w:rPrDefault><w:rPr><w:rFonts w:ascii="${body.latin}" w:hAnsi="${body.latin}" w:cs="${body.latin}" w:eastAsia="${body.eastAsia}" />` +
      `<w:sz w:val="${halfPoints(sizes.body)}" /><w:szCs w:val="${halfPoints(sizes.body)}" /><w:lang w:val="en" w:eastAsia="zh-TW" w:bidi="ar-SA" /></w:rPr></w:rPrDefault>`,
  );
  styles = patchStyle(styles, 'Normal', (original) => runProperties(body, sizes.body, colors.text, original));
  const headingSizes = [sizes.h1, sizes.h2, sizes.h3, sizes.h4];
  headingSizes.forEach((size, index) => {
    styles = patchStyle(styles, `Heading${index + 1}`, (original) => runProperties(heading, size, colors.heading, original));
    styles = patchStyle(styles, `Heading${index + 1}Char`, (original) => runProperties(heading, size, colors.heading, original));
  });
  styles = patchStyle(styles, 'TOCHeading', (original) => runProperties(heading, sizes.h2, colors.heading, original));
  styles = patchStyle(styles, 'Hyperlink', (original) => runProperties(body, sizes.body, colors.link, original));

  const twips = Math.round((template.pageMarginMm / 25.4) * 1440);
  const margins = `<w:pgMar w:top="${twips}" w:right="${twips}" w:bottom="${twips}" w:left="${twips}" w:header="708" w:footer="708" w:gutter="0" />`;
  const document = documentXml.replace(/<w:pgMar\b[^>]*\/>/g, margins);
  return { styles, document };
}

/** Apply a template to a DOCX package and return the new package. */
export function applyTemplate(bytes: Uint8Array, template: Template): Uint8Array {
  const files = unzipSync(bytes);
  const styles = files['word/styles.xml'];
  const document = files['word/document.xml'];
  if (!styles || !document) throw new Error('DOCX is missing word/styles.xml or word/document.xml');
  const patched = applyTemplateToParts(strFromU8(styles), strFromU8(document), template);
  files['word/styles.xml'] = strToU8(patched.styles);
  files['word/document.xml'] = strToU8(patched.document);
  return zipSync(files);
}

/** True when the DOCX carries the template's heading color and body font. */
export function templateApplied(bytes: Uint8Array, template: Template): boolean {
  const styles = unzipSync(bytes)['word/styles.xml'];
  if (!styles) return false;
  const text = strFromU8(styles);
  return text.includes(`w:val="${hex(template.colors.heading)}"`) && text.includes(`w:ascii="${template.docxFonts.body}"`);
}
