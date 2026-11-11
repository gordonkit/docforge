# DocForge AI contributor instructions

Read `README.md`, `docs/plan.md` and `docs/architecture.md` before changing anything.

- See docs/plan.md for what is implemented and CHANGELOG.md for what changed. Distinguish implemented behavior from planned
  work in every doc; never document a feature as working before it is tested. Add user-visible
  changes to the `[Unreleased]` section of CHANGELOG.md.
- Build with `npm run build`, type-check with `npm run check`, test with `npm test`. Integration
  tests need Pandoc and gordon-doc and skip themselves otherwise.
- Mirror SlideForge conventions: Node.js 24+, ESM, strict TypeScript (NodeNext, `.js`
  import extensions), Zod schemas, Vitest. Do not add dependencies without need.
- Keep content in the strict schema. Do not invent fields or accept inline CSS.
- Use the `gordon-doc` CLI/API for conversion and previews rather than re-implementing
  engines, until a native renderer is justified by measured fidelity gaps. Converter fixes
  belong in gordon-doc-converter (docs/fidelity.md lists the HTML contract it implements).
- Preserve Unicode and CJK. Set East Asian fonts explicitly in DOCX output.
- Do not commit generated documents or screenshots by default.
- Do not publish packages, create tags or releases, or change repository visibility without the
  owner's request (see RELEASING.md).
