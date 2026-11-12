# Limitations

What is implemented is verified in Word (see `fidelity.md`). Everything below is **not**
supported yet; do not assume it works.

- **Template scope.** Templates set fonts, sizes, heading and text colors, link color and page
  margins in both the HTML preview and the DOCX. Table borders and shading, code block
  background and list indentation are fixed by gordon-doc-converter. Six templates exist:
  `default`, `classic`, `compact`, `minutes`, `proposal`, `letter` (see `templates.md`).
- **Table of contents** is a field. Word fills it when the file is opened or exported;
  LibreOffice previews show placeholder text.
- A4 portrait only. No landscape sections, custom page sizes, columns, or per-section
  headers and footers. One header and one footer for the whole document.
- Images must be local files inside the folder of the document JSON (or a subfolder). Remote
  URLs, absolute paths and paths that leave that folder are rejected. Image formats are whatever Pandoc and
  Word accept (PNG and JPEG are tested).
- Table cells hold inline text only: no nested lists, images, or merged cells in the schema.
- Footnotes are plain text.
- No comments, tracked changes, or cross-references.
- Pandoc and gordon-doc are external requirements. The container image in `docker/` includes
  them, but it has no Word: its previews come from LibreOffice with substitute fonts, and it is
  not published to a registry yet.
- Fonts are not embedded; the machine opening the DOCX needs the fonts (CJK text uses an
  East Asian font, `Microsoft JhengHei` by default).
- Output is verified structurally, not pixel-for-pixel.
