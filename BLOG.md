# Blog

Posts live in `src/content/blog/*.md`. Add a Markdown file with this frontmatter:

```yaml
---
title: "Post title"
description: "A short description for the card and search results."
author: "Vyacheslav"
authorRole: "Founder"
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
