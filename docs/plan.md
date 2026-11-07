# Roadmap

Private until Phase 2 is complete. Each phase ends with tests and honest docs.

## Phase 0 — Spike (fidelity study)
- [x] Hand-write 3 sample HTML documents (report, meeting minutes, CJK-heavy proposal) — `spikes/phase0/samples/`.
- [x] Convert with `gordon-doc` and render via Word COM — `spikes/phase0/run.ps1`.
- [x] Record what breaks — see `docs/fidelity.md`.
- [x] Decision gate: Pandoc route is OK for body content after converter fixes; header/footer, page numbers, TOC, footnotes still untested (see `docs/fidelity.md`).

## Phase 1 — MVP
- [ ] Project scaffold (TypeScript, Vitest, Zod), CLI: `init`, `check`, `preview`, `export`.
- [ ] Document schema v1 and HTML renderer with tokens; one default template.
- [ ] DOCX export through `gordon-doc` (Pandoc + generated `reference.docx`).
- [ ] Preview: DOCX → PDF → PNG pages.
- [ ] Lint v1 with JSON output.

## Phase 2 — AI-ready and shareable
- [ ] `skills/docforge/` skill with schema reference, examples, authoring loop (`docs/ai-workflow.md`).
- [ ] 3–5 templates (report, minutes, proposal, letter, CJK).
- [ ] zh-TW / en docs, CONTRIBUTING, SECURITY, third-party notices, CI.
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
