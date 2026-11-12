# Security Policy

## Supported versions

Until the first stable release, security fixes are made only on the latest development version.

## Scope

DocForge is a local developer CLI. It reads a JSON file and local image files, then runs the
`gordon-doc` and Pandoc executables to write a DOCX. Input is validated against a strict
schema; links are limited to `http(s)`, `mailto` and `#`. Images must be files inside the
folder of the document JSON: remote URLs, absolute paths and paths that leave that folder are
rejected. DocForge runs only `gordon-doc` (from `DOCFORGE_GORDON_DOC` or `PATH`) and `pandoc`
(from `PATH`), without a shell.
Reports are in scope when crafted JSON escapes that validation, writes outside the requested
output paths, or makes the tool run unintended commands. Problems in Pandoc or Word themselves
should be reported to those projects.

## Reporting a vulnerability

Do not open a public issue. Report privately through GitHub's private security advisory
feature for this repository. Include the affected version, reproducible steps, impact and any
suggested mitigation. Do not include confidential documents, credentials or personal data.
