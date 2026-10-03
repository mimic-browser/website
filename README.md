# Mimic: lightweight browser automation without Chromium

Mimic is a source-available public beta for JavaScript automation and web scraping
with Playwright, Puppeteer and CDP. Compatibility is partial and workload-dependent;
Mimic does not provide rendered screenshots or the full Blink engine.

Mimic's public source-available repository, documentation, benchmarks,
downloads, issues, and contribution guidance are maintained at
[`moreveal/mimic`](https://github.com/moreveal/mimic).

This repository hosts the website at https://mimic.boo. GitHub Pages deploys
the static Astro build from `main` using `.github/workflows/pages.yml`.
The previous https://moreveal.github.io/mimic-overview/ address redirects to
the custom domain through GitHub Pages, including existing page paths.

The apex domain uses GitHub Pages A records (`185.199.108.153`,
`185.199.109.153`, `185.199.110.153`, `185.199.111.153`). The optional `www`
hostname uses a CNAME to `moreveal.github.io`. The custom domain must also be
configured as `mimic.boo` in the repository's Pages settings.
