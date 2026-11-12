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
release with the changelog section as notes and the package tarball attached, publishes
`@gordonkit/docforge` to npm if `package.json` is not private, and pushes the container image
if the `DOCKERHUB_NAMESPACE` variable is set. A published npm version cannot
be reused or replaced; fix a bad release with a new patch version.

The documentation site deploys on every push to `main` (see `docs/deploy-site.md`), not on tags.

## npm setup

The package is named `@gordonkit/docforge` because the unscoped name `docforge` belongs to
another project. The command it installs is still `docforge`. Publishing from the release
workflow needs, on npmjs.com:

- the `gordonkit` organization;
- a trusted publisher for `@gordonkit/docforge`: GitHub Actions, repository
  `gordonkit/docforge`, workflow `release.yml`, environment `npm`. No npm token is stored in
  GitHub, and npm provenance needs the repository to be public.

## Container image setup

The release workflow pushes `docker/Dockerfile` to Docker Hub and GitHub Container Registry
(`ghcr.io/gordonkit/docforge`) with the tags `X.Y.Z`, `X.Y` and `latest`. It needs, in the
GitHub repository settings:

- the variable `DOCKERHUB_NAMESPACE` (`gordonkit`). Without it the image job is skipped;
- the secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`, a Docker Hub access token that can
  write to `gordonkit/docforge`.

The GHCR package starts private; make it public once in its package settings.

## Before the repository goes public (one time)

- [x] No private data in the tree or history (scanned 2026-11-07).
- [x] LICENSE (Apache-2.0), NOTICE, THIRD_PARTY_NOTICES, SECURITY, CONTRIBUTING.
- [x] Limitations documented; templates verified in Word.
- [x] Minimum gordon-doc-converter version (1.0.0) released and documented in `docs/cli.md`.
- [x] Documentation site deployed from CI.
- [x] Re-scan the history for private data right before the switch (2026-11-12).
- [x] First tagged release (`v0.1.0`).
- [x] Switch the repository to public (2026-11-12). Publishing to npm and the container image
      are separate decisions (see above).
