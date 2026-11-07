# Limitations

What is implemented is verified in Word (see `fidelity.md`). Everything below is **not**
supported yet; do not assume it works.

- **Templates do not style the DOCX.** Design tokens drive only the HTML preview
  (`docforge build`). DOCX styles come from gordon-doc-converter's reference document, so
  fonts, colors and spacing in the DOCX are fixed. Only the `default` template exists.
- **Table of contents** is a field. Word fills it when the file is opened or exported;
  LibreOffice previews show placeholder text.
- A4 portrait only. No landscape sections, custom page sizes, columns, or per-section
  headers and footers. One header and one footer for the whole document.
- Images must be local files; remote URLs are rejected. Image formats are whatever Pandoc and
  Word accept (PNG and JPEG are tested).
- Table cells hold inline text only: no nested lists, images, or merged cells in the schema.
- Footnotes are plain text.
- No comments, tracked changes, or cross-references.
- Pandoc and gordon-doc are external requirements. Container images without Pandoc are not
  supported for export.
- Fonts are not embedded; the machine opening the DOCX needs the fonts (CJK text uses an
  East Asian font, `Microsoft JhengHei` by default).
- Output is verified structurally, not pixel-for-pixel.
