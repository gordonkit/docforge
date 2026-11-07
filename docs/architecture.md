# Architecture (design, not yet implemented)

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

## Planned source map

| Path | Responsibility |
| --- | --- |
| `src/schemas/` | Zod schema for documents and templates |
| `src/renderers/html/` | IR → HTML with shared tokens |
| `src/renderers/docx/` | HTML→gordon-doc adapter, later native renderer |
| `src/validators/` | Lint rules with machine-readable output |
| `src/cli/` | `init`, `check`, `preview`, `export` |
| `src/templates/` | Built-in templates and reference.docx generator |
| `skills/docforge/` | AI skill: schema, examples, authoring loop |

## Known pitfalls to design for

- Lists need real numbering definitions, not literal `1.` text.
- Table column widths differ between HTML and Word; require explicit widths.
- CJK needs the `eastAsia` font attribute on runs and styles.
- Images are scaled to page width with explicit DPI.
- TOC is a field; Word asks to update it on open.
- Container images without Pandoc fall back to LibreOffice (`ENGINE_FALLBACK`); lint should surface this.
