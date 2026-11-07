---
name: docforge
description: Author an editable Word (DOCX) document from strict JSON with the docforge CLI. Use when asked to produce a report, memo, proposal or other .docx and the docforge CLI is available. Covers writing the JSON, linting, previewing every page and exporting.
---

# docforge authoring skill

docforge turns one strict JSON file into an editable DOCX. You write JSON only: never HTML,
CSS or raw XML. Docs: `docs/schema.md`, `docs/validation.md`, `docs/templates.md`,
`docs/limitations.md`. The reference document is `examples/report.json`.

## Workflow

1. **Write** one JSON file. Start from `docforge init <file>` or `examples/report.json`.
2. **Check**: `docforge check <file> --json`. Fix every `error` using its `fix` hint and
   review each warning. Repeat until `ok` is true. A schema failure names the JSON path.
3. **Preview**: `docforge preview <file> --engine word-com` on Windows with Word, otherwise
   `docforge preview <file>`. Look at every page image. Check page breaks, table widths,
   image sizes, header and footer, footnotes. Only Word fills the table of contents.
4. **Export**: `docforge export <file> --output <name>.docx`. If it reports a degraded
   DOCX or a missing tool (Pandoc, gordon-doc), fix the environment. Do not work around it.
5. **Report** what you verified and what you did not. Never claim visual fidelity you did
   not check on the preview pages.

## Content rules

- One level-1 heading. Do not skip levels (1, 2, 3). Use `pageBreakBefore` or a `pageBreak`
  block instead of blank paragraphs.
- Every table column needs a `width` percentage and the widths must add up to 100. Each row
  has exactly one cell per column. Keep tables to 6 columns or fewer.
- Every image needs `alt` text and a local file path relative to the JSON file.
- Put a `toc` block after the title only when there are enough headings to need one.
- Use `{ "footnote": "..." }` runs for notes. `href` must be http(s), mailto or `#`.
- `header` and `footer` accept `{page}` and `{pages}`, for example `Page {page} of {pages}`.
- Pick a `template`: `default`, `classic` (formal serif) or `compact` (dense).
- CJK text works. The DOCX uses an East Asian font from the template; the reader's machine
  needs that font installed.

## Never

- Invent fields, put markup in text, or fetch remote images at export time.
- Commit generated DOCX, PDF or page images.
- Ignore a lint error to make a command pass.
