# Deploying the documentation site

The site in `site/` is built from `README.md` and `docs/` by `site/build.mjs`
(`npm --prefix site run build`, output in `site/dist/`). It is served at
`https://docforge.gordonkit.com/` from Cloudflare Pages, like the other GordonKit sites.

The `deploy-documentation` job in `.github/workflows/ci.yml` runs on every push to `main` after
the `test` and `documentation` jobs pass. It:

1. Creates the Pages project (`docforge-docs`, or the repository variable
   `CLOUDFLARE_PAGES_PROJECT` if set) as a Direct Upload project when it does not exist.
2. Adds the custom domain `docforge.gordonkit.com` to that project when it is missing. When the
   `gordonkit.com` zone is on the same Cloudflare account, Cloudflare creates the CNAME to
   `<project>.pages.dev` and issues the certificate; this can take a few minutes after the first run.
3. Uploads `site/dist/` with `wrangler pages deploy`.

## GitHub settings

Repository secrets:

- `CLOUDFLARE_API_TOKEN`: a token with *Account → Cloudflare Pages → Edit*.
- `CLOUDFLARE_ACCOUNT_ID`

The optional repository variable `CLOUDFLARE_PAGES_PROJECT` overrides the project name. The
environment `cloudflare-pages-production` is created on the first deploy; add required reviewers
there if you want a manual gate.

The site is public even while the repository is private.

## Local preview

```sh
npm --prefix site ci
npm --prefix site run build
npx --yes serve site/dist
```
