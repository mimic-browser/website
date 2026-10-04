# Blog

Posts live in `src/content/blog/*.md`. Add a Markdown file with this frontmatter:

```yaml
---
title: "Post title"
description: "A short description for the card and search results."
author: "Vyacheslav Lavrov"
cover: "images/blog-building-runtime.webp"
coverAlt: "Describe what the cover shows."
published: 2026-10-04
lang: en
category: "Development diary"
---
```

The filename becomes the URL: `building-a-browser-runtime-without-chromium.md` → `/blog/building-a-browser-runtime-without-chromium/`.
The content collection validates metadata; the list sorts by publication date, newest first.
Each post uses the shared list and centered reading page. The cover is optional;
omit it for a text-only post. Keep illustrations out of the body unless they explain the article.
The reading page uses the cover for social previews only. Add Markdown `##` headings
at natural section boundaries to generate its table of contents automatically.
The contents sidebar stays visible on desktop and collapses above the text on mobile.
Astro's existing sitemap integration includes the generated pages automatically.
There are no additional dependencies or remote content services.

Run `npm run dev -- --host 127.0.0.1` for local development.
Before publishing, run `npm run build` and `npm run test:links`.

## Social preview images

Every post gets a 1200 × 630 PNG at `/blog/og/<slug>.png`, generated during
`astro build` from its title, author, date and language. No image needs to be
designed or uploaded per post. The template is in `src/lib/blog-og.ts`;
`src/pages/blog/og/[...slug].png.ts` renders each content entry.
Inter is bundled in `assets/fonts` under the included OFL license, so rendering
does not depend on installed fonts or remote services. Sharp is already used
by Astro and is declared directly for this generator.

The title balances complete words and adapts its type size; text is never
truncated. Very long titles that cannot fit safely fail the build with a clear
error. Author and date are also checked for overlap. `cover` remains an optional
list thumbnail, independent of the generated social image. PNGs are build output
in `dist`, not manually maintained content. Run `npm run test:og` to check
short, long and Russian titles, safe areas, contrast and repeatable output.
