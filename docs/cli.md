# CLI

```text
docforge init [document.json]
docforge check <document.json> [--json]
docforge build <document.json> [--output document.html]
docforge export <document.json> --output document.docx [--overwrite]
docforge preview <document.json> [--output-dir <directory>] [--engine word-com|libreoffice] [--json]
```

Build first (`npm run build`), then run `node dist/cli/index.js <command>`.

| Command | What it does |
| --- | --- |
| `init` | Writes a small starter document. Refuses to overwrite an existing file. |
| `check` | Validates the schema and lints the content. `--json` prints `{ ok, file, issues[] }`; each issue has `code`, `severity`, `path`, `message`, and usually `fix`. Exit 1 when there are errors. |
| `build` | Writes a self-contained HTML preview (embedded CSS, running header/footer shown on the page). It is a browser preview, not the DOCX. |
| `export` | Writes the DOCX through `gordon-doc` and then **verifies the package** (header, footer, TOC, footnotes, images, page breaks). A DOCX that lost a requested feature is deleted and the command fails. |
| `preview` | Exports, then renders PDF and PNG pages into `<name>-preview/` (or `--output-dir`). |

`export` and `preview` stop at lint errors; warnings are printed to stderr and do not block.

## Requirements

- `gordon-doc` ([gordon-doc-converter](https://github.com/gordonkit/gordon-doc-converter)). It is found through `DOCFORGE_GORDON_DOC`, then `PATH`, then a sibling `../gordon-doc-converter/.venv` checkout.
- **Pandoc** on `PATH`. Without it `gordon-doc` silently falls back to an engine that drops headers, footers, TOC and page breaks, so DocForge refuses to export.
- For authoritative previews on Windows install Microsoft Word and the converter's `word` and `images` extras (`uv sync --extra word --extra images`), then pass `--engine word-com`. LibreOffice also works but does not fill the table of contents.

**Converter version.** DocForge needs a gordon-doc-converter that includes header/footer meta, `div.toc` and the Word fidelity fixes (merged in gordon-doc-converter PR #61, commit `189c5ea`). They ship in `gordon-doc-converter` 1.0.0rc2 or later. Because it is a release candidate, install it with `pip install --pre gordon-doc-converter` (or `uv tool install --prerelease allow gordon-doc-converter`). Earlier releases silently drop headers, footers and the table of contents.

## Exit codes

0 success, 1 operation or validation failure, 2 invalid CLI usage.
