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
- AI authoring skill in `skills/docforge/SKILL.md`.
- Documentation in English, a zh-TW README and guide, and a documentation site at
  <https://docforge.gordonkit.com/>.
- CONTRIBUTING, SECURITY, THIRD_PARTY_NOTICES and CI (type check, build, test, audit, site
  link check).

### Requirements

- Node.js 24+, Pandoc, and gordon-doc-converter 1.0.0rc2 or later.

[Unreleased]: https://github.com/gordonkit/docforge/commits/main
