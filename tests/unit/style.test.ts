import { strToU8, unzipSync, strFromU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { applyTemplate, applyTemplateToParts, templateApplied } from '../../src/exporters/style.js';
import { classicTemplate, compactTemplate, defaultTemplate, listTemplates } from '../../src/templates/default.js';

const styles = `<w:styles><w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="21"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr /></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:rFonts w:ascii="X"/><w:b/><w:color w:val="0F4761" w:themeColor="accent1"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
</w:styles>`;
const documentXml = '<w:document><w:sectPr><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" /></w:sectPr></w:document>';

describe('template styling', () => {
  it('has several templates', () => {
    expect(listTemplates()).toEqual(['default', 'classic', 'compact']);
  });

  it('writes fonts, sizes and colors into styles', () => {
    const { styles: out } = applyTemplateToParts(styles, documentXml, classicTemplate);
    expect(out).toContain('w:ascii="Georgia"');
    expect(out).toContain('w:eastAsia="PMingLiU"');
    expect(out).toMatch(/styleId="Heading1"[\s\S]*<w:color w:val="000000" \/><w:sz w:val="48" \/>/);
    expect(out).not.toContain('themeColor');
    expect(out).toContain('<w:b/>');
    expect(out).toMatch(/styleId="Normal"[\s\S]*<w:sz w:val="23" \/>/);
  });

  it('sets page margins from the template', () => {
    const { document } = applyTemplateToParts(styles, documentXml, compactTemplate);
    expect(document).toContain('w:top="850"');
    const wide = applyTemplateToParts(styles, documentXml, classicTemplate).document;
    expect(wide).toContain('w:left="1417"');
  });

  it('patches a package and detects it', () => {
    const bytes = zipSync({ 'word/styles.xml': strToU8(styles), 'word/document.xml': strToU8(documentXml) });
    expect(templateApplied(bytes, defaultTemplate)).toBe(false);
    const patched = applyTemplate(bytes, defaultTemplate);
    expect(templateApplied(patched, defaultTemplate)).toBe(true);
    expect(strFromU8(unzipSync(patched)['word/document.xml']!)).toContain('w:header="708"');
  });
});
