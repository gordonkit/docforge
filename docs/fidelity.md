# Phase 0 fidelity study: HTML → DOCX through `gordon-doc` (Pandoc)

Date: 2026-11-07. Method: three hand-written HTML samples in `spikes/phase0/samples/`
(report, meeting minutes, CJK proposal) converted with `gordon-doc convert --to docx`
(Pandoc 3.13), rendered to PDF with **Word COM (Word 16.0)** and to page images. Reproduce
with `spikes/phase0/run.ps1`. LibreOffice rendering was used only as a cross-check.

## Results before changes (stock gordon-doc-converter 1.0.0rc1)

| Area | Result |
| --- | --- |
| Headings 1–4, paragraphs, bold/italic, links, sub/superscript, hard breaks | OK |
| Nested bullet and ordered lists (3 levels) | OK, real Word numbering |
| Colspan / rowspan | OK |
| Images, `width` attribute, scaling to page | OK, fit within margins |
| CJK text, mixed CJK/Latin, full-width punctuation | OK (`Microsoft JhengHei` East Asian font) |
| Blockquote, horizontal rule | OK |
| `<title>` | **Gap:** added an extra Title paragraph above the document's own H1 |
| `break-before: page` | **Gap:** ignored, no page break |
| Code / inline code | **Gap:** forced to the body font (reference restyle overrode `VerbatimChar`), no background |
| Tables | **Gap:** no borders, header row not distinguished |
| Column widths from `th style="width:…"` | **Gap:** ignored, equal columns |
| `<th>` cells in body rows (key/value tables) | Gap: rendered as plain cells (not bold) |

## Fixes made in gordon-doc-converter (unreleased, uncommitted at time of writing)

`src/gordon_doc_converter/engines/pandoc.py`, covered by `tests/unit/engines/test_pandoc.py`:

- Drop Title/Subtitle paragraphs when the body has a Heading 1.
- Lua filter turns `break-before: page|always` / `page-break-before: always` on headings and
  `div` into marker paragraphs; post-processing converts them to `pageBreakBefore`
  (or an explicit page break before a table).
- Reference styles: monospace `VerbatimChar` (Consolas, East Asian font kept), shaded
  `SourceCode`, bordered `Table` style with padding and bold shaded first row.

Re-run after the changes: all of the above now render correctly in Word COM.

## Remaining limits and consequences for DocForge

- Column widths work only with `<colgroup><col style="width:…%">` (verified in Word). The
  DocForge HTML renderer must always emit `colgroup`; never rely on cell styles.
- Key/value tables (`th` in body rows) lose their header semantics; the DocForge schema
  should model them explicitly (e.g. a `bold` first column option) rather than via HTML.
- Page breaks must be expressed as `break-before: page` on a heading or `div`.
- Header/footer, page numbers, TOC fields, footnotes and custom page size are **not yet
  tested**; they are not expressible through Pandoc HTML input and need either Pandoc
  filters/`reference.docx` or the native renderer (Phase 3).
- Word and Pandoc must be installed to verify; container images without Pandoc fall back to
  LibreOffice (`ENGINE_FALLBACK`) and were not evaluated.

## Decision gate

Pandoc + restyled `reference.docx` is **good enough for the MVP body content** (text, lists,
tables, images, CJK, page breaks) once the fixes above are in. It is **not yet sufficient**
for headers/footers, page numbers, TOC and footnotes. Proposed path: proceed with Phase 1 on
the Pandoc route, extend the converter (header/footer/TOC via template or filter) as needed,
and keep the native `docx` renderer (Phase 3) as the fallback if those cannot be reached.
