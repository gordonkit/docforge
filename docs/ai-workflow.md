# AI authoring workflow

1. Read `docs/schema.md` and `examples/report.json`.
2. Write one JSON document. Use only the block types and fields in the schema; do not invent
   fields or put HTML or CSS in text. Keep one level-1 heading, do not skip heading levels,
   give every table column a width that sums to 100, and give every image `alt` text.
3. Run `docforge check <file> --json`. Fix every `error` using its `fix` hint, and review the
   warnings. Repeat until `ok` is true.
4. Run `docforge preview <file> --engine word-com` (or without `--engine` where Word is not
   installed) and look at every page image: page breaks, table widths, image sizes, header
   and footer, footnotes. The table of contents is only filled by Word.
5. Run `docforge export <file> --output <name>.docx`. If it reports a degraded DOCX or a
   missing tool, fix the environment; do not work around it.
6. Report what was verified and what was not (see `docs/limitations.md`). Never claim visual
   fidelity that you did not check on the preview pages.

Do not commit generated DOCX, PDF or page images.
