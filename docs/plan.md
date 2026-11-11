# Roadmap

DocForge is pre-release (v0.1.0). This page says what works today, what comes next and the
decisions behind it. Completed work is listed per release in
[`CHANGELOG.md`](../CHANGELOG.md); known gaps are in [`limitations.md`](limitations.md).

## Status

Working and verified in Word:

- CLI: `init`, `check`, `build`, `preview`, `export`.
- Document schema v1 (strict JSON), HTML preview, lint with JSON output.
- DOCX export through `gordon-doc` (Pandoc) with real Word structure: Heading styles,
  numbered lists, TOC field, header, footer, page numbers, footnotes.
- Six templates (`default`, `classic`, `compact`, `minutes`, `proposal`, `letter`) applied to
  the DOCX styles and page margins.
- Page previews (DOCX → PDF → PNG) for checking output, with Word COM as the reference engine.
- An AI authoring skill (`skills/docforge/SKILL.md`) and this documentation site.

## Next

- First tagged release.
- After that, the gaps in [`limitations.md`](limitations.md) are the candidates for new work;
  open an issue to say which ones matter to you.

## Native renderer (only if needed)

The Pandoc route covers what DocForge supports today (see the [fidelity study](fidelity.md)).
A native renderer will be built only if measured fidelity gaps justify it:

- IR → DOCX with `docx` (npm): styles, numbering, tables, header/footer, TOC field.
- Side-by-side fidelity tests against the Pandoc path.

## Ideas

Not planned yet; open an issue to discuss before starting.

- DOCX → IR import for round-trip editing.
- PDF renderer from the same IR.
- A shared core package with SlideForge (tokens, lint framework, preview pipeline).
- MCP server wrapper.

## Decisions

- **Input is JSON only** (strict schema). Markdown and HTML are not accepted as authoring input.
- **Conversion goes through the `gordon-doc` CLI** (subprocess), not its HTTP API. Converter
  fixes belong in [gordon-doc-converter](https://github.com/gordonkit/gordon-doc-converter).
- **Fidelity is verified with Word COM** (most accurate), cross-checked with LibreOffice.
- **Docs are written in English first**, with a zh-TW README and guide.
