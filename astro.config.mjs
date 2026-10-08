import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://mimic.boo",
  base: process.env.PAGES_BASE_PATH || "/",
  // Accept both URL forms so missing paths reach our own 404 page.
  // Public links and static directory output still use trailing slashes.
  trailingSlash: "ignore",
  output: "static",
  vite: {
    server: {
      watch: {
        // Windows edits on a WSL-mounted checkout need polling for live updates.
        usePolling: Boolean(process.env.WSL_DISTRO_NAME),
        interval: 300,
      },
    },
  },
  integrations: [
    sitemap({
      serialize(item) {
        const base = process.env.PAGES_BASE_PATH;
        if (base)
          item.url = item.url.replace(
            `https://mimic.boo${base}/`,
            "https://mimic.boo/",
          );
        return item;
      },
    }),
  ],
});
