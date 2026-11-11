# Contributing

DocForge is early. Keep changes small, typed, tested and honest about what Word does.

## Development

Use Node.js 24+ and the checked-in lockfile:

```sh
npm ci
npm run check
npm run build
npm test
```

Integration tests need [Pandoc](https://pandoc.org/installing.html) on `PATH` and the
[gordon-doc](https://github.com/gordonkit/gordon-doc-converter) CLI (set `DOCFORGE_GORDON_DOC`
or install it next to this repo). Without them they skip themselves, so a green run does not
prove DOCX export works. Run them locally before changing the exporter or templates, and use
`docforge preview <file> --engine word-com` on Windows to look at the pages. Word COM needs Word
installed and `gordon-doc doctor` reporting it available (in gordon-doc-converter, run
`uv sync --extra word --extra images`).

## Rules

- Keep content in the strict schema. Do not accept inline CSS, HTML or free-form fields.
- Conversion bugs belong in gordon-doc-converter; record the HTML contract in `docs/fidelity.md`.
- A new lint rule needs a test and a row in `docs/validation.md`; a new template needs a row in
  `docs/templates.md` and a look at its preview pages.
- Document implemented behavior only, and list gaps in `docs/limitations.md`.
- Add user-visible changes to the `[Unreleased]` section of `CHANGELOG.md`.
- Do not commit generated documents or screenshots.
