import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { parse } from "parse5";
import { marked } from "marked";
import { createReleaseData } from "../src/lib/release-data.mjs";

const root = resolve(process.argv[2] ?? "dist");
const selected = createReleaseData(
  JSON.parse(
    await readFile(process.argv[3] ?? "public/release-cache.json", "utf8"),
  ),
);
const text = (node) =>
  node.nodeName === "#text"
    ? node.value
    : (node.childNodes ?? []).map(text).join("");
const attr = (node, name) =>
  node.attrs?.find((item) => item.name === name)?.value;
function all(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap((child) => all(child, predicate)),
  ];
}
let versions = 0,
  assets = 0,
  copies = 0;
for (const path of [
  "index.html",
  "download/index.html",
  "docs/index.html",
  "sdk/index.html",
  "changelog/index.html",
]) {
  const page = parse(await readFile(join(root, path), "utf8"));
  for (const element of all(
    page,
    (node) => attr(node, "data-release-version") !== undefined,
  )) {
    assert.equal(text(element), selected.tag, `${path}: release label`);
    versions++;
  }
  for (const element of all(
    page,
    (node) => attr(node, "data-release-asset") !== undefined,
  )) {
    const name = attr(element, "data-release-asset");
    const asset = [selected.windows, selected.linux, selected.checksums].find(
      (item) => item.name.endsWith(name),
    );
    assert.ok(asset, `${path}: known asset ${name}`);
    assert.equal(
      attr(element, "href"),
      asset.browser_download_url,
      `${path}: ${name}`,
    );
    assets++;
  }
  if (path === "download/index.html") {
    const names = all(
      page,
      (node) => attr(node, "data-release-asset") !== undefined,
    ).map((node) => attr(node, "data-release-asset"));
    assert.deepEqual(
      names.sort(),
      ["SHA256SUMS", "linux-amd64.tar.gz", "windows-amd64.zip"],
      "standalone downloads include both supported platforms and checksums",
    );
  }
  for (const window of all(page, (node) =>
    attr(node, "class")?.split(" ").includes("code-window"),
  )) {
    const button = all(
      window,
      (node) => attr(node, "data-copy") !== undefined,
    )[0];
    const code = all(window, (node) => node.tagName === "pre")[0];
    assert.equal(
      text(code).trimEnd(),
      attr(button, "data-copy").trimEnd(),
      `${path}: copied code matches displayed code`,
    );
    copies++;
  }
  if (path === "docs/index.html") {
    const links = all(page, (node) => node.tagName === "a").map((node) =>
      attr(node, "href"),
    );
    for (const document of [
      "environment-profiles.md",
      "media-device-profiles-design.md",
      "camera.md",
    ]) {
      assert.ok(
        links.includes(selected.docURL(document)),
        `documentation ${document} follows selected release`,
      );
    }
  }
  if (path === "sdk/index.html") {
    const snippets = all(
      page,
      (node) => attr(node, "data-copy") !== undefined,
    ).map((node) => attr(node, "data-copy"));
    assert.ok(
      snippets.every((snippet) => !snippet.includes("/path/to/")),
      "SDK setup must not ask readers to resolve placeholder paths",
    );
    assert.ok(
      snippets.includes("node launch.mjs") &&
        snippets.includes("python launch.py"),
      "quickstarts include commands to run their scripts",
    );
    assert.ok(
      text(page).includes(`runtimeVersion: "${selected.version}"`),
      "Node runtime example follows release",
    );
    assert.ok(
      text(page).includes(`runtime_version="${selected.version}"`),
      "Python runtime example follows release",
    );
  }
  if (path === "changelog/index.html") {
    const notes = all(
      page,
      (node) => attr(node, "data-release-notes") !== undefined,
    )[0];
    assert.equal(attr(notes, "data-version"), selected.tag);
    assert.equal(attr(notes, "data-updated-at"), selected.release.updated_at);
    assert.equal(
      text(notes),
      text(parse(await marked.parse(selected.release.body))),
      "release notes match snapshot",
    );
  }
}
assert.ok(versions >= 3 && copies >= 6);
console.log(
  `Release ${selected.tag}: ${versions} labels, ${assets} download links, docs, SDK examples and ${copies} copy buttons agree.`,
);
