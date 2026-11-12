# Deploying the documentation site

The site in `site/` is built from `README.md` and `docs/` by `site/build.mjs`
(`npm --prefix site run build`, output in `site/dist/`). It is served at
`https://docforge.gordonkit.com/` by the Cloudflare Worker `docforge` using
[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/): no Worker
script, only the files in `site/dist/`.

The pages are static HTML. `site/public/style.css` and `site/public/site.js` follow the SlideForge
documentation site (top bar, grouped side menu, search, language menu, light/dark theme). The
search reads `search-index.json`, which the build writes, so the Content-Security-Policy in
`site/public/_headers` allows scripts and requests from the site's own origin only.

Every page carries a JSON-LD block (`structuredData` in `site/build.mjs`): a `WebSite` and a
`TechArticle` whose `publisher` is the GordonKit `Organization`
(`https://gordonkit.com/#organization`), the same `@id` gordonkit.com uses. It is data, not a
script, so the Content-Security-Policy does not apply to it.

## How it deploys

The `deploy-documentation` job in `.github/workflows/ci.yml` runs on every push to `main` after
the `test` and `documentation` jobs pass. It downloads the built site, then runs
`wrangler deploy` with `wrangler.jsonc` at the repository root:

- `name: "docforge"`: the existing Worker. Wrangler uploads a new version of it.
- `assets.directory: "./site/dist"`, `not_found_handling: "404-page"` (serves `404.html`),
  `html_handling: "auto-trailing-slash"`. `site/public/_headers` is honored.
- `workers_dev: false` and `preview_urls: false`: only the custom domain serves the site.
- **No `routes` key.** The custom domain `docforge.gordonkit.com` is attached to the Worker in the
  Cloudflare dashboard (Workers & Pages → docforge → Settings → Domains & Routes). Leaving
  `routes` out means `wrangler deploy` does not add, change or remove it, and the token does not
  need zone permissions.

## GitHub settings

Repository secrets:

- `CLOUDFLARE_API_TOKEN`: a token with *Account → Workers Scripts → Edit*.
- `CLOUDFLARE_ACCOUNT_ID`

The environment `cloudflare-workers-production` is created on the first deploy; add required
reviewers there if you want a manual gate.

The site is public regardless of the repository's visibility.

## Local preview

```sh
npm --prefix site ci
npm --prefix site run build
npx --yes serve site/dist
```

To check the Wrangler configuration without deploying:

```sh
npx --yes wrangler@4.157.0 deploy --dry-run
```
