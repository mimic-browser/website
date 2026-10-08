import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "parse5";
import { createReleaseData } from "../src/lib/release-data.mjs";
import { join } from "node:path";

const root = process.argv[2] ?? "dist";
const page = parse(await readFile(join(root, "sdk/index.html"), "utf8"));
const { version } = createReleaseData(
  JSON.parse(
    await readFile(process.argv[3] ?? "public/release-cache.json", "utf8"),
  ),
);
const attr = (node, name) =>
  node.attrs?.find((item) => item.name === name)?.value;
const all = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...(node.childNodes ?? []).flatMap((child) => all(child, predicate)),
];
const expected = {
  javascript: ["playwright", "puppeteer"],
  typescript: ["playwright", "puppeteer"],
  python: ["playwright-sync", "playwright-async", "pyppeteer"],
  csharp: ["playwright", "puppeteersharp"],
  java: ["playwright"],
  kotlin: ["playwright"],
  go: ["rod", "chromedp"],
  rust: ["chromiumoxide"],
  ruby: ["ferrum"],
  php: ["chrome-php"],
};
const ids = all(page, (node) => attr(node, "id") !== undefined).map((node) =>
  attr(node, "id"),
);
assert.equal(
  ids.length,
  new Set(ids).size,
  "All controls and panels need unique IDs",
);
for (const tab of all(
  page,
  (node) => attr(node, "data-sdk-kind") !== undefined,
)) {
  assert.ok(
    ids.includes(attr(tab, "aria-controls")),
    "Every tab controls an existing panel",
  );
}
let scenarios = 0;
for (const [language, clients] of Object.entries(expected)) {
  const panel = all(
    page,
    (node) => attr(node, "data-sdk-language-panel") === language,
  )[0];
  assert.ok(panel, `${language}: language is selectable`);
  assert.deepEqual(
    all(panel, (node) => attr(node, "data-sdk-client-panel") !== undefined).map(
      (node) => attr(node, "data-sdk-client-panel"),
    ),
    clients,
    `${language}: native clients are selectable`,
  );
  for (const client of clients) {
    const clientPanel = all(
      panel,
      (node) => attr(node, "data-sdk-client-panel") === client,
    )[0];
    const install = all(
      clientPanel,
      (node) => attr(node, "data-sdk-install") !== undefined,
    )[0];
    assert.ok(
      all(install, (node) => attr(node, "data-copy") !== undefined).length,
      `${language}/${client}: installation is copyable`,
    );
    assert.deepEqual(
      all(
        clientPanel,
        (node) => attr(node, "data-sdk-example-panel") !== undefined,
      ).map((node) => attr(node, "data-sdk-example-panel")),
      ["launch", "connect"],
      "SDK quickstarts expose launch and connect only",
    );
    for (const scenario of ["launch", "connect"]) {
      const example = all(
        clientPanel,
        (node) => attr(node, "data-sdk-example-panel") === scenario,
      )[0];
      assert.ok(example, `${language}/${client}/${scenario}: scenario exists`);
      assert.equal(
        attr(example, "data-sdk-available"),
        "true",
        `${language}/${client}/${scenario}: complete guide is available`,
      );
      const snippets = all(
        example,
        (node) => attr(node, "data-copy") !== undefined,
      ).map((node) => attr(node, "data-copy"));
      assert.ok(
        snippets.length >= 2 && snippets.every((snippet) => snippet.trim()),
        `${language}/${client}/${scenario}: source and run command are copyable`,
      );
      assert.ok(
        snippets.every(
          (snippet) => !/\/path\/to\/|YOUR_[A-Z_]+|<your-/i.test(snippet),
        ),
        `${language}/${client}/${scenario}: no unresolved placeholders`,
      );
      if (scenario === "launch") {
        assert.ok(
          snippets.some((snippet) => snippet.includes(version)),
          `${language}/${client}: runtime pin follows the selected release`,
        );
      }
      scenarios++;
    }
  }
}
console.log(
  `SDK guides: ${Object.keys(expected).length} language choices, ${scenarios} complete scenarios, valid tab targets.`,
);
