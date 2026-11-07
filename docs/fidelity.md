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
- Custom page size beyond A4 and per-section headers/footers are not supported.
- Word and Pandoc must be installed to verify; container images without Pandoc fall back to
  LibreOffice (`ENGINE_FALLBACK`) and were not evaluated.

## Phase 0b: header, footer, page numbers, TOC, footnotes

Sample `04-running-parts.html`, rendered with Word COM (primary) and LibreOffice (cross-check).

| Feature | HTML contract | Word | LibreOffice |
| --- | --- | --- | --- |
| Footnotes | `<sup><a class="footnote-ref" href="#fn1">` + `<section class="footnotes">` | OK, real footnotes, CJK OK | OK |
| Header / footer | `<meta name="gordon-header|gordon-footer" content="…">` | OK, CJK OK | OK |
| Page numbers | `{page}` / `{pages}` in header or footer text → PAGE / NUMPAGES fields | OK (`Page 1 of 3`) | OK |
| Table of contents | `<div class="toc" data-depth="2" data-title="Contents"></div>` | OK, field updated by Word on open/export | Placeholder only (no auto update) |

Pandoc reads footnotes natively; the rest needed new support in
`gordon-doc-converter` (`engines/pandoc.py`: Lua filter for the TOC field, header/footer
parts added to the package after conversion), documented in its `CHANGELOG.md`.
No CLI or API change: the contract lives in the HTML source.

Caveats found:

- If Pandoc is not on `PATH`, `gordon-doc` silently falls back to another engine for HTML →
  DOCX and the result loses all of the above. DocForge must check `gordon-doc doctor` /
  engine output and fail loudly rather than export a degraded file.
- A TOC is only populated by Word (or after a manual field update). Previews that use
  LibreOffice will show the placeholder; use Word COM for authoritative previews.

## Decision gate

**Decision: proceed with Phase 1 on the Pandoc route.** Body content, headers, footers, page
numbers, TOC and footnotes all render correctly in Word once the converter changes are in.
The native `docx` renderer (Phase 3) is not needed for the MVP; revisit it only if later
requirements (per-section headers, custom page sizes, LibreOffice-accurate TOC, tracked
changes) cannot be met.
