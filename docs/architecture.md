# Architecture

DocForge implements the Pandoc route below. The native renderer is not built (see the roadmap).

## Pipeline

```text
Document JSON (+ template it names) ─► strict Zod schema ─► typed document model (IR)
   ─► HTML renderer (shared CSS/tokens)  ─► browser preview
   ─► lint (structure, tables, images, fonts)
   ─► DOCX renderer
        Today:     HTML ─► gordon-doc (Pandoc + reference.docx) ─► DOCX
        If needed: IR ─► `docx` (npm) native renderer ─► DOCX
   ─► preview: DOCX ─► PDF ─► PNG pages (gordon-doc / LibreOffice)
```

The document model (IR) is the stable center. Input formats and output renderers are
adapters, so PDF or Markdown renderers can be added later.

## Content model

Block types: `heading(1-4)`, `paragraph`, `list(ordered|bullet, nested)`, `table`,
`image(+caption, alt)`, `quote`, `code`, `pageBreak`, `toc`.
Document metadata: title, author, language, template, header/footer text with page numbers.
Inline: bold, italic, code, superscript, subscript, link, footnote, line break.

## Templates and tokens

A template is a set of tokens (fonts including East Asian, sizes, colors, page margin). After
gordon-doc converts the HTML, `src/exporters/style.ts` writes the tokens into the DOCX
`styles.xml` (defaults, Normal, Heading 1–4, TOC heading, hyperlink) and `pgMar`. Table borders,
code backgrounds and list indents still come from the converter.

## Source map

| Path | Responsibility |
| --- | --- |
| `src/schemas/document.ts` | Strict Zod schema and `parseDocument` |
| `src/validators/lint.ts` | Lint rules with machine-readable issues |
| `src/renderers/html.ts` | Document → HTML (export markup or browser preview) |
| `src/templates/default.ts` | Design tokens and preview CSS |
| `src/images.ts` | Keeps image paths inside the document folder |
| `src/exporters/gordon-doc.ts` | Locating and running `gordon-doc` and Pandoc, minimum converter version |
| `src/exporters/docx.ts` | Export, DOCX verification, preview (PDF + PNG) |
| `src/cli/run.ts` | `init`, `check`, `build`, `export`, `preview` (`src/cli/index.ts` is the executable entry) |
| `src/exporters/style.ts` | Applies template tokens to DOCX styles and margins |
| `skills/docforge/` | AI authoring skill |

## Known pitfalls to design for

- Lists need real numbering definitions, not literal `1.` text.
- Table column widths differ between HTML and Word; require explicit widths.
- CJK needs the `eastAsia` font attribute on runs and styles.
- Images are scaled to page width with explicit DPI.
- TOC is a field; Word asks to update it on open.
- Container images without Pandoc fall back to LibreOffice (`ENGINE_FALLBACK`); lint should surface this.
