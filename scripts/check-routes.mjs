import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { preview } from "astro";

const server = await preview({
  root: fileURLToPath(new URL("../", import.meta.url)),
  logLevel: "silent",
  server: { host: "127.0.0.1", port: 0, open: false },
});
const base = (process.env.PAGES_BASE_PATH || "").replace(/\/$/, "");
const origin = `http://127.0.0.1:${server.port}${base}`;

try {
  for (const path of ["/missing-page", "/missing-page/", "/missing/page?x=1"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 404, path);
    const html = await response.text();
    assert.match(html, /Back to Mimic/, `${path}: must serve the branded 404`);
    assert.doesNotMatch(html, /trailingSlash is set to/, path);
  }
  for (const path of ["/", "/docs", "/docs/"]) {
    const response = await fetch(origin + path);
    assert.equal(response.status, 200, path);
    assert.doesNotMatch(await response.text(), /Back to Mimic/, path);
  }
  console.log(
    "PASS: branded 404 and valid pages with and without trailing slashes",
  );
} finally {
  await server.stop();
}
