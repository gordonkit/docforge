# Container image

The image runs the DocForge CLI with everything `export` and `preview` need: Node.js 24,
Pandoc 3.13, gordon-doc 1.0.0, LibreOffice Writer and the Noto CJK fonts. It is built on the
[`gordonkit/gordon-doc-converter`](https://hub.docker.com/r/gordonkit/gordon-doc-converter)
image and targets `linux/amd64`. It replaces the local Pandoc, Python and LibreOffice setup.

## Published image

Release tags from 0.1.2 publish the image to Docker Hub as
[`gordonkit/docforge`](https://hub.docker.com/r/gordonkit/docforge) and to GitHub Container
Registry as `ghcr.io/gordonkit/docforge`. Both receive the same image. A tag such as `v0.1.2`
publishes the image tags `0.1.2`, `0.1` and `latest`; the image tag matches the npm package
version. Either name works in the commands below.

To use it without cloning this repository, mount the folder that holds the document at
`/work`:

```bash
docker run --rm --read-only --tmpfs /tmp --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --volume "$PWD:/work" \
  gordonkit/docforge:latest export /work/document.json --output /work/document.docx
```

```powershell
docker run --rm --read-only --tmpfs /tmp --security-opt no-new-privileges `
  --volume "${PWD}:/work" `
  gordonkit/docforge:latest export /work/document.json --output /work/document.docx
```

In Git Bash on Windows, set `MSYS_NO_PATHCONV=1` first; otherwise Git Bash rewrites container
paths such as `/work/document.json` into Windows paths. Use a version tag instead of `latest`
when exports must be reproducible. The Compose file below always builds
`gordonkit/docforge:local` from the current source tree and does not pull the published image.

## CLI profile

Run these commands from the repository root. Compose builds `gordonkit/docforge:local` from
the current source tree on first use; `--build` rebuilds it after source changes. Arguments
after `cli` go to the CLI, and paths are container paths under `/work`:

```console
docker compose -f docker/compose.yaml --profile cli run --rm --build cli check /work/examples/report.json
docker compose -f docker/compose.yaml --profile cli run --rm cli export /work/examples/report.json --output /work/report.docx
docker compose -f docker/compose.yaml --profile cli run --rm cli preview /work/examples/report.json --output-dir /work/report-preview --engine libreoffice
```

By default `/work` is the repository root. To work on a document elsewhere, set
`DOCFORGE_WORK` to an absolute host folder before running Compose. Images must be inside the
folder of the document JSON, so mounting that folder is enough.

On Linux the container runs as user `gordon` (uid 10001), which cannot write to a folder owned
by you. Add `--user "$(id -u):$(id -g)"` after `run --rm`. Docker Desktop on Windows and macOS
does not need it.

Without Compose, after the image is built:

```bash
docker run --rm --read-only --tmpfs /tmp --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --volume "$PWD:/work" \
  gordonkit/docforge:local export /work/document.json --output /work/document.docx
```

```powershell
docker run --rm --read-only --tmpfs /tmp --security-opt no-new-privileges `
  --volume "${PWD}:/work" `
  gordonkit/docforge:local export /work/document.json --output /work/document.docx
```

In Git Bash on Windows, set `MSYS_NO_PATHCONV=1` first; otherwise Git Bash rewrites container
paths such as `/work/document.json` into Windows paths.

## Limits

- **No Word.** `--engine word-com` needs Microsoft Word on Windows and does not work in the
  container. Previews use LibreOffice, which shows placeholder text for the table of contents.
  The exported DOCX is the same file either way; Word fills the table of contents when it
  opens it.
- **Fonts.** The image has the Noto CJK fonts and LibreOffice's defaults, not the fonts the
  templates name (for example Microsoft JhengHei). Preview pages are rendered with substitute
  fonts, so line breaks and page counts can differ from Word. The DOCX still names the template
  fonts.
- **Size.** About 1.5 GB, most of it LibreOffice and the CJK fonts from the base image.
- There is no HTTP API. The image is a packaged CLI.

## Licenses

DocForge's `LICENSE`, `NOTICE` and `THIRD_PARTY_NOTICES.md` are in
`/usr/share/licenses/docforge/`. The base image keeps the converter's notices in
`/usr/share/licenses/gordon-doc-converter/`, and Pandoc (GPL-2.0-or-later) and the Debian
packages keep theirs under `/usr/share/doc/`.
