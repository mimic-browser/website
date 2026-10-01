import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://mimic.boo",
  base: "/",
  output: "static",
  integrations: [sitemap()],
});
