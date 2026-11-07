# DocForge

> **Status: private, planning phase (Phase 0).** Nothing here is implemented yet.
> The repository will be made open source once Phase 2 is complete.

DocForge is an AI-ready framework for creating consistent, **editable Word (DOCX)**
documents. It is the document sibling of [SlideForge](https://github.com/gordonkit/slideforge)
(HTML/CSS → PPTX): an AI writes strict, validated content, and DocForge renders,
previews, lints and exports it.

```text
strict content (JSON / Markdown) ─► validate ─► HTML + tokens ─► preview
                                                     └──────────► DOCX (real Word styles)
```

## Principles

- **Constrained input.** AI authors a strict schema or a small semantic HTML subset, never free CSS.
- **Real Word structure.** Headings map to Heading 1–3, lists use numbering definitions, TOC is a field. Users can keep editing in Word.
- **Template driven.** Themes are tokens plus a `reference.docx`; restyle without touching content.
- **Feedback loop.** Lint and preview results are machine-readable so an AI can fix its own output.
- **Honest limits.** Do not claim pixel-perfect conversion; document what is unsupported.

## Relationship to other repos

- [`gordon-doc-converter`](https://github.com/gordonkit/gordon-doc-converter) — conversion orchestration (Pandoc, LibreOffice, Word COM, page images). DocForge uses it for HTML → DOCX (Phase 1), DOCX → PDF and page-image previews.
- [`slideforge`](https://github.com/gordonkit/slideforge) — presentations. Shares design-token ideas and the AI workflow; code sharing is deferred until both stabilize.

See [`docs/plan.md`](docs/plan.md) for the roadmap and [`docs/architecture.md`](docs/architecture.md) for the design.
