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

For local review, run `npm run dev -- --host 127.0.0.1 --port 4321` and open
`http://localhost:4321/`. Local review does not deploy the site. Contact links
use `mailto:slava@mimic.boo`.

Public content describes usage, supported behavior, limitations and significant
shipped changes. Private task trackers and internal activity reports do not
belong in public source or pages. The build runs `npm run test:public` against
both source assets and generated output; see `AGENTS.md` for editorial rules.

The SDK quickstart has language and client selectors, with launch/connect demos. Keep each setup
complete: installation commands, all required source files and the run command.
Example data lives in `src/lib/sdk-examples-*.ts`; `npm run test:sdk` checks that
every integration exposes complete guides and valid accessible tab targets.

### Maintain documentation

Documentation is split into focused routes. `src/lib/documentation.ts` owns the
catalog and search metadata; both the landing catalog and the keyboard search
use it without a server request. Keep reader navigation and direct section links
valid when adding a guide. `npm run test:docs` verifies the generated destinations.

The API reference uses a local snapshot of the SDK wire schema and runtime semantic
support registry. Builds do not need another checkout. To refresh it explicitly:

```sh
python scripts/sync-api-reference.py --schema ../mimic-sdk/schema/mimic/protocol.json --support ../mimic/internal/cdp/protocol_support.json
```

Add `--check` to verify the snapshot without changing it. Commands and types have
stable deep links; the reference search reveals matching entries and long lists
use small visible groups. Keep runnable recipes in the relevant guide and the
basic launch/connect demos in the SDK quickstart.

### Update the displayed release

Run `npm run release:sync -- --version <exact-version>` and then `npm run build`.
The sync command fetches that exact GitHub release, verifies the manifest against
its checksums and the Windows/Linux asset metadata, and atomically replaces
`public/release-cache.json`. This is the website's single selected release snapshot;
do not edit its tag independently of its assets and release notes.

All current runtime version labels, downloads, documentation links, runtime pin examples,
and release notes are derived from that snapshot during the same build. The browser
does not partially update them from a different release. Historical benchmark data,
articles, and the archived `RELEASE_NOTES.md` retain their original versions.
`npm run test:release` checks both the release sync failure boundaries and the built
pages, including matching visible code and copied code.
`npm run test:release-switch` additionally builds an isolated fixture release to
verify the single-snapshot update without changing the working copy or its output.

SDK releases are independent. Update `src/lib/sdk-release.ts` to select the SDK
source release used by Git installation commands, generated example projects and
local package filenames. Publishing a runtime does not change the SDK version.
