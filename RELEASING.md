# Releasing

Steps for maintainers. Contributors do not need this file.

## Every release

1. CI is green on `main`.
2. Move the `[Unreleased]` entries in `CHANGELOG.md` under the new version and date, and add
   the compare link.
3. Set `version` in `package.json` (and `package-lock.json` with `npm install --package-lock-only`).
4. Run `npm run check:release -- --tag vX.Y.Z` and `npm run test:package`.
5. Commit, then tag and push: `git tag -a vX.Y.Z -m "vX.Y.Z"` and `git push origin vX.Y.Z`.

The tag starts `.github/workflows/release.yml`. It repeats the checks, creates the GitHub
release with the changelog section as notes and the package tarball attached, and publishes
`@gordonkit/docforge` to npm if `package.json` is not private. A published npm version cannot
be reused or replaced; fix a bad release with a new patch version.

The documentation site deploys on every push to `main` (see `docs/deploy-site.md`), not on tags.

## Publishing to npm (one time)

The package is named `@gordonkit/docforge` because the unscoped name `docforge` belongs to
another project. The command it installs is still `docforge`. Nothing is published while
`"private": true` is in `package.json`. To start publishing:

1. Create the `gordonkit` organization on npmjs.com, if it does not exist.
2. On npmjs.com, add a trusted publisher for `@gordonkit/docforge`: GitHub Actions, repository
   `gordonkit/docforge`, workflow `release.yml`, environment `npm`. npm provenance needs the
   repository to be public.
3. Remove `"private": true` from `package.json`, add the `npm install` instructions to the
   README files and `docs/cli.md`, and release a new version.

## Before the repository goes public (one time)

- [x] No private data in the tree or history (scanned 2026-11-07).
- [x] LICENSE (Apache-2.0), NOTICE, THIRD_PARTY_NOTICES, SECURITY, CONTRIBUTING.
- [x] Limitations documented; templates verified in Word.
- [x] Minimum gordon-doc-converter version (1.0.0) released and documented in `docs/cli.md`.
- [x] Documentation site deployed from CI.
- [ ] Re-scan the history for private data right before the switch.
- [x] First tagged release (`v0.1.0`).
- [ ] Switch the repository to public. Publishing to npm is a separate decision (see above).
