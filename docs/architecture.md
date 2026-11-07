# Architecture

Phase 1 implements the Pandoc route below. The native renderer (Phase 3) is not built.

## Pipeline

```text
Document JSON (+ template it names) ─► strict Zod schema ─► typed document model (IR)
   ─► HTML renderer (shared CSS/tokens)  ─► browser preview (Phase 1)
   ─► lint (structure, tables, images, fonts)
   ─► DOCX renderer
        Phase 1: HTML ─► gordon-doc (Pandoc + reference.docx) ─► DOCX
        Phase 3: IR ─► `docx` (npm) native renderer ─► DOCX
   ─► preview: DOCX ─► PDF ─► PNG pages (gordon-doc / LibreOffice)
```

The document model (IR) is the stable center. Input formats and output renderers are
adapters, so PDF or Markdown renderers can be added later.

## Content model

Block types: `heading(1-3)`, `paragraph`, `list(ordered|bullet, nested)`, `table`,
`image(+caption, alt)`, `quote`, `code`, `pageBreak`, `toc`, `callout`.
Document metadata: title, author, language, page size, margins, header/footer text,
page numbers. Inline: bold, italic, code, link, footnote.

## Templates and tokens

A template = tokens (fonts incl. East Asian, sizes, colors, spacing, table style) +
`reference.docx` generated from those tokens so Word style names (`Heading 1`,
`Table Grid`, ...) match the output.

## Source map

| Path | Responsibility |
| --- | --- |
| `src/schemas/document.ts` | Strict Zod schema and `parseDocument` |
| `src/validators/lint.ts` | Lint rules with machine-readable issues |
| `src/renderers/html.ts` | Document → HTML (export markup or browser preview) |
| `src/templates/default.ts` | Design tokens and preview CSS |
| `src/exporters/gordon-doc.ts` | Locating and running `gordon-doc` and Pandoc |
| `src/exporters/docx.ts` | Export, DOCX verification, preview (PDF + PNG) |
| `src/cli/index.ts` | `init`, `check`, `build`, `export`, `preview` |
| `skills/docforge/` | AI skill (planned, Phase 2) |

## Known pitfalls to design for

- Lists need real numbering definitions, not literal `1.` text.
- Table column widths differ between HTML and Word; require explicit widths.
- CJK needs the `eastAsia` font attribute on runs and styles.
- Images are scaled to page width with explicit DPI.
- TOC is a field; Word asks to update it on open.
- Container images without Pandoc fall back to LibreOffice (`ENGINE_FALLBACK`); lint should surface this.
