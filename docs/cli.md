# CLI

```text
docforge init [document.json]
docforge check <document.json> [--json]
docforge build <document.json> [--output document.html]
docforge export <document.json> --output document.docx [--overwrite]
docforge preview <document.json> [--output-dir <directory>] [--engine word-com|libreoffice] [--json]
```

Install with `npm install -g @gordonkit/docforge`, or run one command with
`npx @gordonkit/docforge <command>`. In a checkout of this repository, run `npm ci` and
`npm run build`, then `node dist/cli/index.js <command>`.

| Command | What it does |
| --- | --- |
| `init` | Writes a small starter document. Refuses to overwrite an existing file. |
| `check` | Validates the schema and lints the content. `--json` prints `{ ok, file, issues[] }`; each issue has `code`, `severity`, `path`, `message`, and usually `fix`. Exit 1 when there are errors. |
| `build` | Writes a self-contained HTML preview (embedded CSS, running header/footer shown on the page). It is a browser preview, not the DOCX. |
| `export` | Writes the DOCX through `gordon-doc` and then **verifies the package** (header, footer, TOC, footnotes, images, page breaks). A DOCX that lost a requested feature is deleted and the command fails. |
| `preview` | Exports, then renders PDF and PNG pages into `<name>-preview/` (or `--output-dir`). |

`export` and `preview` stop at lint errors; warnings are printed to stderr and do not block.

## Requirements

- `gordon-doc` ([gordon-doc-converter](https://github.com/gordonkit/gordon-doc-converter)) 1.0.0 or later: `pip install "gordon-doc-converter[images]"` (the `images` extra renders the PNG pages for `preview`). DocForge runs the file named by `DOCFORGE_GORDON_DOC` if that is set, otherwise `gordon-doc` from `PATH`. It looks nowhere else.
- **Pandoc** on `PATH`. Without it `gordon-doc` silently falls back to an engine that drops headers, footers, TOC and page breaks, so DocForge refuses to export. DocForge is tested with Pandoc 3.13. Old releases lose content: the Pandoc 3.1.3 packaged by Ubuntu 24.04 drops footnotes, which export verification reports as a degraded DOCX. Install a current release from [pandoc.org](https://pandoc.org/installing.html) instead of the distribution package.
- For authoritative previews on Windows install Microsoft Word and add the `word` extra (`pip install "gordon-doc-converter[word,images]"`), then pass `--engine word-com`. LibreOffice also works but does not fill the table of contents.

**Converter version.** DocForge needs gordon-doc-converter 1.0.0 or later, which adds header/footer meta, `div.toc` and the Word fidelity fixes. Earlier releases drop headers, footers and the table of contents, so DocForge refuses to run a `gordon-doc` older than 1.0.0 and tells you to upgrade.

## Container

The `gordonkit/docforge` image has Node.js, Pandoc, gordon-doc and LibreOffice, so none of the
requirements above need to be installed. It cannot use Word, so previews are
rendered by LibreOffice. See [`docker/README.md`](../docker/README.md).

## Exit codes

0 success, 1 operation or validation failure, 2 invalid CLI usage.
