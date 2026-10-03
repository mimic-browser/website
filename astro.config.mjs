import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://mimic.boo",
  base: process.env.PAGES_BASE_PATH || "/",
  output: "static",
  integrations: [sitemap({
    serialize(item) {
      const base = process.env.PAGES_BASE_PATH;
      if (base) item.url = item.url.replace(`https://mimic.boo${base}/`, "https://mimic.boo/");
      return item;
    },
  })],
});
