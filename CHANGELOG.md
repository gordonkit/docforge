# Changelog

All notable changes are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Every page of the documentation site carries JSON-LD that names GordonKit as its publisher,
  with the same identifiers gordonkit.com uses.

## [0.1.3] - 2026-11-12

The first release published entirely by the release workflow. The CLI, the package contents
and the container image are the same as in 0.1.2.

### Changed

- The npm package is published through trusted publishing (GitHub OIDC) and carries a
  provenance statement. 0.1.2 was published by hand and has none.
- The release workflow can be run by hand for an existing tag to finish a release that stopped
  half-way; steps whose result already exists are skipped.

## [0.1.2] - 2026-11-12

The first release on npm and as a container image. The CLI behaves as in 0.1.0. There is no
0.1.1: that tag exists, but its release workflow failed to start and published nothing.

### Changed

- The package is published to npm as `@gordonkit/docforge` (the unscoped name belongs to
  another project): `npm install -g @gordonkit/docforge`. The command is still `docforge`.
- `npm run build` clears `dist` first, so files from removed modules cannot end up in the package.

### Added

- `npm run test:package` installs the packed tarball in a clean project and uses it; CI runs it.
- A release workflow: a version tag creates the GitHub release from the changelog, publishes
  the package to npm with provenance and pushes the container image.
- A container image (`docker/`) with Node.js 24, Pandoc 3.13, gordon-doc 1.0.0 and LibreOffice,
  built on the gordon-doc-converter image, published as `gordonkit/docforge` on Docker Hub and
  `ghcr.io/gordonkit/docforge`. CI builds it and exports and previews the example in it.

## [0.1.0] - 2026-11-12

First tagged release.

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

- Node.js 24+, Pandoc (tested with 3.13; the 3.1.3 packaged by Ubuntu 24.04 drops footnotes),
  and gordon-doc-converter 1.0.0 or later.

[Unreleased]: https://github.com/gordonkit/docforge/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/gordonkit/docforge/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/gordonkit/docforge/compare/v0.1.0...v0.1.2
[0.1.0]: https://github.com/gordonkit/docforge/releases/tag/v0.1.0
