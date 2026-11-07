# Templates

A template is a set of design tokens. Choose one with the top-level `template` field. The
tokens are applied to the HTML preview (`docforge build`) and to the DOCX styles on export.

| Name | Look | Fonts (Latin / East Asian) | Body | Margins |
| --- | --- | --- | --- | --- |
| `default` | Clean sans-serif, blue headings | Segoe UI / Microsoft JhengHei | 10.5 pt | 20 mm |
| `classic` | Serif, black headings, formal | Georgia / PMingLiU | 11.5 pt | 25 mm |
| `compact` | Dense, teal headings | Calibri / Microsoft JhengHei | 9.5 pt | 15 mm |

## What a template controls in the DOCX

Document defaults, Normal, Heading 1–4, the table-of-contents heading, hyperlinks and page
margins. The fonts must be installed on the machine that opens the DOCX.

Not controlled yet: table borders and shading, code block background, list indentation.

## Adding a template

Add a `Template` object in `src/templates/default.ts` and register it in the `templates`
map. `docforge export` verifies that the heading color and body font reached `styles.xml`.
