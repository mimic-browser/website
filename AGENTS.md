# Mimic website

The website presents Mimic's public product, usage, supported behavior and
material limitations. Public text is English.

- Never expose private issue tracker identifiers, links, exported tasks, internal
  task relationships or project-management metadata in source, filenames, assets,
  copied release notes or built pages.
- Do not publish daily work diaries, personal browsing activity, agent progress
  reports, prompt histories or task-completion checklists. Explain what users can
  do and what they need to know. Technical implementation details belong in
  contributor documentation when they help contributors make a real decision.
- Keep investigation logs and local qualification receipts in ignored local
  storage or private artifacts. Public benchmarks retain meaningful methodology,
  measured results and limitations without narrating private work sessions.
- Review imported content as well as authored pages. Run `npm run test:public`
  before building or sharing the site; the normal build also checks its output.
- The selected runtime release comes from `public/release-cache.json`. Update it
  with `npm run release:sync -- --version <exact-version>`; do not hardcode another
  current release in pages or examples.
- Keep setup examples copyable and describe available behavior accurately.
- For local review, use a dev server. Do not publish or push unless requested.
  Do not launch headful browsers or programs requiring user interaction.
