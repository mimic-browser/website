import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const roots = ["src", "public", "dist"];
const textExtensions = new Set([
  ".astro",
  ".md",
  ".mdx",
  ".html",
  ".json",
  ".js",
  ".mjs",
  ".ts",
  ".txt",
  ".svg",
]);
const internalReference =
  /\bMIM-\d+\b|https?:\/\/(?:[\w-]+\.)*linear\.app\b|<issue\b[^>]*\bid=/i;
const failures = [];
let files = 0;

async function inspect(path) {
  let entries;
  try {
    entries = await readdir(path, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const child = resolve(path, entry.name);
    if (internalReference.test(entry.name)) {
      failures.push(relative(root, child));
    }
    if (entry.isDirectory()) {
      await inspect(child);
    } else if (entry.isFile() && textExtensions.has(extname(entry.name))) {
      files += 1;
      if (internalReference.test(await readFile(child, "utf8"))) {
        failures.push(relative(root, child));
      }
    }
  }
}

for (const directory of roots) await inspect(resolve(root, directory));
if (failures.length) {
  console.error(
    "Public content contains private project-management references:",
  );
  for (const path of new Set(failures)) console.error(`- ${path}`);
  process.exitCode = 1;
} else {
  console.log(`Public content check passed (${files} text files).`);
}
