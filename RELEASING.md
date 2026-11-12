# Releasing

Steps for maintainers. Contributors do not need this file.

## Every release

1. CI is green on `main`.
2. Move the `[Unreleased]` entries in `CHANGELOG.md` under the new version and date, and add
   the compare link.
3. Set `version` in `package.json` (and `package-lock.json` with `npm install --package-lock-only`).
4. Commit, then tag and push: `git tag -a vX.Y.Z -m "vX.Y.Z"` and `git push origin vX.Y.Z`.
5. Create the GitHub release from the tag with the changelog section as notes.

The documentation site deploys on every push to `main` (see `docs/deploy-site.md`), not on tags.

## Before the repository goes public (one time)

- [x] No private data in the tree or history (scanned 2026-11-07).
- [x] LICENSE (Apache-2.0), NOTICE, THIRD_PARTY_NOTICES, SECURITY, CONTRIBUTING.
- [x] Limitations documented; templates verified in Word.
- [x] Minimum gordon-doc-converter version (1.0.0) released and documented in `docs/cli.md`.
- [x] Documentation site deployed from CI.
- [ ] Re-scan the history for private data right before the switch.
- [ ] First tagged release (`v0.1.0`).
- [ ] Switch the repository to public; then remove `"private": true` from `package.json` only if
      the package is going to be published to npm.
