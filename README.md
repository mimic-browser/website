# Mimic: lightweight browser automation without Chromium

Mimic is a source-available public beta for JavaScript automation and web scraping
with Playwright, Puppeteer and CDP. Compatibility is partial and workload-dependent;
Mimic does not provide rendered screenshots or the full Blink engine.

Mimic's public source-available repository, documentation, benchmarks,
downloads, issues, and contribution guidance are maintained at
[`mimic-browser/runtime`](https://github.com/mimic-browser/runtime).

Website source: https://github.com/mimic-browser/website. GitHub Pages deploys
the static Astro build from `main` using `.github/workflows/pages.yml`.
The website is https://mimic.boo; https://mimic-browser.github.io/website/
redirects to it through GitHub Pages after domain cutover.
The workflow reads the Pages base path so assets and links work both at the
preview project URL and, after domain cutover, at the canonical root domain.
Canonical and sitemap URLs always use https://mimic.boo.

The separate legacy repository https://github.com/moreveal/mimic-overview
retains redirects for https://moreveal.github.io/mimic-overview/ and
existing page paths after cutover. Its public history is preserved here.

The apex domain uses GitHub Pages A records (`185.199.108.153`,
`185.199.109.153`, `185.199.110.153`, `185.199.111.153`). The optional `www`
hostname should use a CNAME to `mimic-browser.github.io` after migration.
The custom domain is configured as `mimic.boo` in this repository's Pages
settings and verified for the organization. Retain the Pages verification TXT.

Run `npm ci`, `npm run build`, and `npm run test:links` for production checks.
Set `PAGES_BASE_PATH=/website` to check the project preview deployment.
The original contributor and source lines in `LICENSE.md` are preserved.
