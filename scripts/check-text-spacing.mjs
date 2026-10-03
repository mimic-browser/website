import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { parse } from "parse5";

const root = resolve(process.argv[2] ?? "dist");
const containers = new Set([
  "p",
  "li",
  "td",
  "th",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "figcaption",
  "dt",
  "dd",
]);
const skipped = new Set(["pre", "script", "style", "svg"]);
const breaks = new Set([
  "br",
  "div",
  "section",
  "table",
  "ul",
  "ol",
  "p",
  "li",
]);
const word = /[\p{L}\p{N}]/u;

function textOf(node) {
  if (node.nodeName === "#text") return node.value;
  if (skipped.has(node.tagName)) return "";
  return (node.childNodes ?? []).map(textOf).join("");
}

function boundaries(container) {
  const failures = [];
  let previous = "";
  function walk(node) {
    if (skipped.has(node.tagName)) {
      previous = "";
      return;
    }
    if (
      node !== container &&
      (containers.has(node.tagName) || breaks.has(node.tagName))
    ) {
      previous = "";
      return;
    }
    if (node.nodeName === "#text" && node.value) {
      const current = node.value;
      if (word.test(previous.at(-1) ?? "") && word.test(current[0])) {
        failures.push(`${previous.slice(-60)}|${current.slice(0, 80)}`);
      }
      previous = current;
    }
    for (const child of node.childNodes ?? []) walk(child);
  }
  walk(container);
  return failures;
}

// These exercise the detector itself: inline words need a real text space,
// while punctuation, line breaks and nested blocks remain valid boundaries.
function firstParagraph(html) {
  const doc = parse(html);
  return doc.childNodes
    .find((n) => n.tagName === "html")
    .childNodes.find((n) => n.tagName === "body").childNodes[0];
}
assert.equal(
  boundaries(firstParagraph("<p><a>Chromium</a>for extraction</p>")).length,
  1,
);
assert.equal(
  boundaries(firstParagraph("<p>Use<code>CDP</code></p>")).length,
  1,
);
assert.equal(
  boundaries(
    firstParagraph("<p><strong>Partial</strong><span>compatibility</span></p>"),
  ).length,
  1,
);
assert.equal(
  boundaries(
    firstParagraph("<p><a>Chromium</a> for extraction; <code>CDP</code>.</p>"),
  ).length,
  0,
);
assert.equal(boundaries(firstParagraph("<p>First<br>Second</p>")).length, 0);

const failures = [];
let files = 0;
const documents = new Map();
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) scan(path);
    else if (entry.name.endsWith(".html")) {
      files++;
      const doc = parse(readFileSync(path, "utf8"));
      documents.set(relative(root, path).replaceAll("\\", "/"), doc);
      function walk(node) {
        if (skipped.has(node.tagName)) return;
        if (containers.has(node.tagName)) {
          for (const boundary of boundaries(node))
            failures.push(`${relative(root, path)}: ${boundary}`);
        }
        for (const child of node.childNodes ?? []) walk(child);
      }
      walk(doc);
    }
  }
}
scan(root);
const guidePhrase =
  "Read Run Playwright without Chromium for a complete extraction example, or Mimic versus Chromium for workload selection and measured memory boundaries.";
for (const file of ["index.html", "docs/index.html", "examples/index.html"]) {
  const text = textOf(documents.get(file)).replace(/\s+/g, " ");
  if (!text.includes(guidePhrase))
    failures.push(`${file}: missing correctly spaced guide sentence`);
}
if (failures.length) {
  console.error(`Missing inline text spaces:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(
  `Checked ${files} HTML files: inline word boundaries and guide sentences have real spaces.`,
);
