import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "parse5";

const root = process.argv[2] ?? "dist";
const base = (process.env.PAGES_BASE_PATH ?? "").replace(/\/$/, "");
const attr = (node, name) =>
  node.attrs?.find((item) => item.name === name)?.value;
const all = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.childNodes ?? []).flatMap((child) => all(child, predicate)),
];
const pages = new Map();
async function collect(directory, path = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory())
      await collect(join(directory, entry.name), `${path}${entry.name}/`);
    else if (entry.name === "index.html") {
      pages.set(
        `/${path}`,
        parse(await readFile(join(directory, entry.name), "utf8")),
      );
    }
  }
}
await collect(root);
const hub = pages.get("/docs/");
assert.ok(hub, "Documentation has a landing route");
assert.equal(all(hub, (node) => node.tagName === "docs-hub").length, 1);
assert.equal(
  all(hub, (node) => attr(node, "class")?.split(" ").includes("code-window"))
    .length,
  0,
  "The catalog does not load guide code examples",
);
assert.equal(
  all(hub, (node) => attr(node, "data-hub-category") !== undefined).length,
  6,
);
const reference = JSON.parse(
  await readFile("src/lib/mimic-reference.json", "utf8"),
);
const referencePage = pages.get("/docs/sdk/reference/");
assert.ok(referencePage);
for (const command of reference.commands) {
  assert.ok(
    all(referencePage, (node) => attr(node, "id") === command.id).length,
    `${command.name}: stable deep link`,
  );
  assert.ok(
    all(
      hub,
      (node) =>
        attr(node, "href") === `${base}/docs/sdk/reference/#${command.id}`,
    ).length,
    `${command.name}: searchable from the catalog`,
  );
}
let links = 0;
for (const [path, page] of pages) {
  if (!path.startsWith("/docs/")) continue;
  const ids = all(page, (node) => attr(node, "id") !== undefined).map((node) =>
    attr(node, "id"),
  );
  assert.equal(
    ids.length,
    new Set(ids).size,
    `${path}: unique control and anchor IDs`,
  );
  assert.equal(
    all(page, (node) => node.tagName === "docs-search").length,
    1,
    `${path}: documentation search is available`,
  );
  for (const link of all(
    page,
    (node) => node.tagName === "a" && attr(node, "href"),
  )) {
    const href = attr(link, "href");
    if (!href.startsWith("/") && !href.startsWith("#")) continue;
    const url = new URL(href, `https://docs.test${base}${path}`);
    const destinationPath =
      base && url.pathname.startsWith(`${base}/`)
        ? url.pathname.slice(base.length)
        : url.pathname;
    const destination = pages.get(destinationPath);
    if (!destination) continue; // Asset links are covered by test:links.
    if (url.hash) {
      const id = decodeURIComponent(url.hash.slice(1));
      assert.ok(
        all(destination, (node) => attr(node, "id") === id).length,
        `${path}: ${href} has a real destination anchor`,
      );
    }
    links++;
  }
}
console.log(
  `Docs: ${reference.commands.length} searchable commands; ${links} navigation and section links resolve.`,
);
