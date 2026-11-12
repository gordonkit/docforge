# Document schema v1

A document is one JSON file. Every object is strict: unknown fields are rejected, and the
error names the path (for example `$.blocks[3].rows[1]`). The source of truth is
`src/schemas/document.ts`.

## Top level

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `1` | Required. |
| `title` | string | Required. Stored as the document title property. |
| `language` | string | Default `en`. |
| `author` | string | Stored as a document property; not printed in the body. |
| `header`, `footer` | string | Running text. `{page}` and `{pages}` become live page-number fields, e.g. `Page {page} of {pages}`. |
| `template` | string | Default `default`. Built-in: `default`, `classic`, `compact`, `minutes`, `proposal`, `letter` (see `templates.md`). |
| `blocks` | Block[] | Required, at least one. |

## Inline text

Anywhere text is accepted (`paragraph`, `quote`, list items, table cells) you can give a
plain string or an array of runs:

- `"plain"`; `{ "text", "bold", "italic", "code", "sup", "sub", "href" }`
- `{ "footnote": "Note text" }` — numbered automatically in document order
- `{ "break": true }` — hard line break

`href` must start with `http://`, `https://`, `mailto:` or `#`.

## Blocks

| `type` | Fields |
| --- | --- |
| `heading` | `level` 1–4, `text`, `pageBreakBefore?` |
| `paragraph` | `text` (inline) |
| `list` | `ordered?`, `items`: strings or `{ text, children? }`, nested to any depth |
| `table` | `columns`: `[{ header, width }]` (widths are percentages and must add up to 100), `rows`: arrays of inline cells, one per column; `headerColumn?` makes the first cell of each row bold; `caption?` |
| `image` | `src` (relative to the JSON file, inside its folder or a subfolder; no `..`, absolute paths or URLs), `alt` (required), `caption?`, `width?` (percent) |
| `quote` | `text` (inline) |
| `code` | `text`, `language?` |
| `pageBreak` | — |
| `toc` | `depth?` 1–4 (default 3), `title?` (default "Table of Contents"; `""` hides it) |

See `examples/report.json` for a document that uses every block type.
