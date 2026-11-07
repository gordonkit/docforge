# Validation and lint

Validation runs in three layers. Each produces messages an AI author can act on.

1. **Schema** (`docforge check`): strict JSON structure. Failures stop everything and report
   `path: message`.
2. **Lint** (`docforge check --json`): content that is valid but would give a poor document.
3. **Export verification** (`docforge export`): after conversion the DOCX package is opened and
   checked against what the document asked for.

## Lint rules

| Code | Severity | Meaning |
| --- | --- | --- |
| `unknown-template` | error | `template` is not a built-in template. |
| `table-width-sum` | error | Column widths do not add up to 100. |
| `image-missing` | error | Image file not found relative to the JSON file. |
| `image-remote` | error | Image `src` is a URL; download it next to the document. |
| `multiple-h1` | warning | More than one level-1 heading. |
| `heading-level-skip` | warning | A heading jumps more than one level (for example 1 → 3). |
| `table-too-wide` | warning | More than 6 columns; unlikely to fit A4 portrait. |
| `empty-text` | warning | Paragraph or quote with no visible text. |
| `toc-without-headings` | warning | A `toc` block but no headings. |
| `multiple-toc` | warning | More than one `toc` block. |
| `unknown-placeholder` | warning | `{…}` in header/footer other than `{page}` or `{pages}`. |

## Export verification

`export` fails, and deletes the output, if the DOCX is missing a requested header, footer,
table-of-contents field, footnote, image or page break. This catches the case where the
converter fell back to a weaker engine. It does not prove visual fidelity: use `preview`
and look at the pages.
