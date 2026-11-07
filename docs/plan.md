# Roadmap

Private until Phase 2 is complete. Each phase ends with tests and honest docs.

## Phase 0 — Spike (fidelity study)
- [x] Hand-write 3 sample HTML documents (report, meeting minutes, CJK-heavy proposal) — `spikes/phase0/samples/`.
- [x] Convert with `gordon-doc` and render via Word COM — `spikes/phase0/run.ps1`.
- [x] Record what breaks — see `docs/fidelity.md`.
- [x] Decision gate: Pandoc route is OK for body content after converter fixes; header, footer, page numbers, TOC and footnotes also verified in Word (see `docs/fidelity.md`).

## Phase 1 — MVP
- [x] Project scaffold (TypeScript, Vitest, Zod), CLI: `init`, `check`, `build`, `preview`, `export`.
- [x] Document schema v1 and HTML renderer with tokens; one default template (tokens drive the HTML preview only).
- [x] DOCX export through `gordon-doc` (Pandoc + generated `reference.docx`). HTML contract: `colgroup` widths, `break-before: page`, `gordon-header`/`gordon-footer` meta, `div.toc`, footnote markup.
- [x] Preview: DOCX → PDF → PNG pages (`--engine word-com` for authoritative output).
- [x] Lint v1 with JSON output, plus DOCX export verification.
- [x] Templates style the DOCX: tokens are written into `styles.xml` and page margins after conversion (`src/exporters/style.ts`), verified in Word.

## Phase 2 — AI-ready and shareable
- [x] `skills/docforge/SKILL.md`: authoring loop and content rules (links to the schema docs and `examples/report.json`).
- [ ] 3–5 templates: `default`, `classic`, `compact` done; minutes, proposal, letter remain.
- [x] CONTRIBUTING, SECURITY, CI (check, build, test, audit).
- [x] zh-TW README and guide (`docs/zh-TW/`), `THIRD_PARTY_NOTICES.md`.
- [ ] `site/` documentation website.
- [ ] **Open-source checklist:** license headers, no private data in history, docs honest about limits, first tagged release → then switch repo to public.

## Phase 3 — Native renderer (only if Phase 0/1 shows gaps)
- [ ] IR → DOCX with `docx` (npm): styles, numbering, tables, header/footer, TOC field.
- [ ] Side-by-side fidelity tests against the Pandoc path.

## Later ideas
- DOCX → IR import for round-trip editing.
- PDF renderer from the same IR.
- Shared `forge-core` package with SlideForge (tokens, lint framework, preview pipeline).
- MCP server wrapper.

## Decisions
- **Input is JSON only** (strict schema). Markdown and HTML are not accepted as authoring input.
- **Conversion goes through the `gordon-doc` CLI** (subprocess), not the HTTP API.
- **Docs are written in English first**; zh-TW follows in Phase 2.
- **Fidelity is verified with Word COM** (most accurate), cross-checked with LibreOffice.
  Word and Pandoc must be installed locally and `gordon-doc doctor` must report Word COM
  available (run `uv sync --extra word --extra images` in gordon-doc-converter).
