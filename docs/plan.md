# Roadmap

Private until Phase 2 is complete. Each phase ends with tests and honest docs.

## Phase 0 — Spike (fidelity study)
- [ ] Hand-write 3 sample HTML documents (report, meeting minutes, CJK-heavy proposal).
- [ ] Convert with `gordon-doc` (HTML → DOCX via Pandoc, with and without `reference.docx`).
- [ ] Record what breaks: tables, nested lists, CJK fonts, page breaks, headers/footers, images.
- [ ] Decision gate: is Pandoc + reference.docx + filters good enough? Write result in `docs/fidelity.md`.

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

## Open questions
- Input: JSON only, or Markdown with front matter as well?
- Call `gordon-doc` via CLI subprocess or HTTP API?
- Language of the first docs (zh-TW first, English second?).
