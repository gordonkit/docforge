# Changelog

All notable changes are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

First public release candidate, `0.1.0`.

### Added

- CLI with `init`, `check`, `build`, `preview` and `export`.
- Document schema v1 (strict JSON, Zod) and an HTML renderer driven by design tokens.
- DOCX export through `gordon-doc` (Pandoc and a generated `reference.docx`): column widths,
  page breaks, one header and footer with page numbers, TOC field and footnotes.
- Templates write their tokens into the DOCX `styles.xml` and page margins. Six templates:
  `default`, `classic`, `compact`, `minutes`, `proposal`, `letter`.
- Page previews: DOCX → PDF → PNG, with `--engine word-com` for reference output.
- Lint with JSON output, and DOCX export verification.
- Images must be inside the folder of the document JSON. Lint reports `image-outside-document`
  for absolute paths and paths that leave it, and `export` refuses them.
- `gordon-doc` is run only from `DOCFORGE_GORDON_DOC` or `PATH`, and a converter older than
  1.0.0 is refused with an upgrade hint.
- AI authoring skill in `skills/docforge/SKILL.md`.
- Documentation in English, a zh-TW README and guide, and a documentation site at
  <https://docforge.gordonkit.com/>. The site shares the SlideForge documentation look: top bar
  with search, language menu and light/dark toggle, grouped side menu, "On this page" list and
  previous/next links.
- CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, THIRD_PARTY_NOTICES, Dependabot and CI (type check,
  build, tests including DOCX export and LibreOffice preview, audit, site link check).

### Requirements

- Node.js 24+, Pandoc, and gordon-doc-converter 1.0.0 or later.

[Unreleased]: https://github.com/gordonkit/docforge/commits/main
