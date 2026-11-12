# DocForge

> **Status: pre-release (v0.1.0).** The CLI, schema, lint and DOCX export work and are
> verified in Word. See the [roadmap](docs/plan.md) and [changelog](CHANGELOG.md).

DocForge is an AI-ready framework for creating consistent, **editable Word (DOCX)**
documents. It is the document sibling of [SlideForge](https://github.com/gordonkit/slideforge)
(HTML/CSS → PPTX): an AI writes strict, validated content, and DocForge renders,
previews, lints and exports it.

```text
strict content (JSON) ─► validate + lint ─► HTML ─► gordon-doc (Pandoc) ─► DOCX ─► verify
                                  └─► HTML preview            └─► PDF + PNG pages (Word)
```

## Quick start

```bash
npm install && npm run build
node dist/cli/index.js init document.json
node dist/cli/index.js check document.json
node dist/cli/index.js export document.json --output document.docx
node dist/cli/index.js preview document.json --engine word-com
```

Requires Node.js 24+, [Pandoc](https://pandoc.org/installing.html) and
[gordon-doc](https://github.com/gordonkit/gordon-doc-converter) 1.0.0 or later
(`pip install "gordon-doc-converter[images]"`), or build the [container image](docker/README.md),
which has all of them. See [`docs/cli.md`](docs/cli.md).

## Principles

- **Constrained input.** AI authors a strict JSON schema, never HTML or CSS.
- **Real Word structure.** Headings map to Heading 1–4, lists use numbering definitions, TOC is a field. Users can keep editing in Word.
- **Template driven.** Six built-in templates are design tokens applied to the DOCX styles; restyle without touching content.
- **Feedback loop.** Lint and preview results are machine-readable so an AI can fix its own output.
- **Honest limits.** Do not claim pixel-perfect conversion; document what is unsupported.

## Relationship to other repos

- [`gordon-doc-converter`](https://github.com/gordonkit/gordon-doc-converter) — conversion orchestration (Pandoc, LibreOffice, Word COM, page images). DocForge uses it for HTML → DOCX (Phase 1), DOCX → PDF and page-image previews.
- [`slideforge`](https://github.com/gordonkit/slideforge) — presentations. Shares design-token ideas and the AI workflow; code sharing is deferred until both stabilize.

[繁體中文](README.zh-TW.md)

Docs: [CLI](docs/cli.md) · [schema](docs/schema.md) · [templates](docs/templates.md) · [validation](docs/validation.md) · [AI workflow](docs/ai-workflow.md) · [limitations](docs/limitations.md) · [fidelity study](docs/fidelity.md) · [architecture](docs/architecture.md) · [roadmap](docs/plan.md) · [changelog](CHANGELOG.md).
