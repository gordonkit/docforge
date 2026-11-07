# Deploying the documentation site

The site in `site/` is built from `README.md` and `docs/` by `site/build.mjs`
(`npm --prefix site run build`, output in `site/dist/`). It is served at
`https://docforge.gordonkit.com/` from Cloudflare Pages, like the other GordonKit sites.

The `deploy-documentation` job in `.github/workflows/ci.yml` runs on pushes to `main` and does
nothing until `CLOUDFLARE_PAGES_PROJECT` is set, so nothing is published by accident.

## One-time setup (Cloudflare and GitHub)

1. **Pages project.** Cloudflare dashboard → Workers & Pages → Create → Pages → *Direct Upload*
   (no Git integration; GitHub Actions uploads the build). Name it, for example, `docforge-docs`.
2. **Custom domain.** In that project → Custom domains → add `docforge.gordonkit.com`. When the
   `gordonkit.com` zone is on the same Cloudflare account, the CNAME to `<project>.pages.dev` is
   created automatically.
3. **API token.** Create a token with *Account → Cloudflare Pages → Edit*.
4. **GitHub settings** for this repository (or the organization, if the other sites share them):
   - Secret `CLOUDFLARE_API_TOKEN`
   - Variables `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_PAGES_PROJECT`
   - Environment `cloudflare-pages-production` (created automatically on the first deploy; add
     required reviewers if you want a manual gate).

The site is public even while the repository is private. Set `CLOUDFLARE_PAGES_PROJECT` only when
you want the documentation to be visible.

## Local preview

```sh
npm --prefix site ci
npm --prefix site run build
npx --yes serve site/dist
```
