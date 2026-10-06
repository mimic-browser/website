import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const source = process.argv[2];
if (!source)
  throw new Error("Provide the authoritative Mimic runtime checkout");
const destination = resolve("src/content/optimize");
await mkdir(destination, { recursive: true });
const provenance = {};
for (const name of (await readdir(resolve(source, "docs/optimize")))
  .filter((name) => name.endsWith(".md") && name !== "results.md")
  .sort()) {
  const body = await readFile(resolve(source, "docs/optimize", name));
  await writeFile(resolve(destination, name), body);
  provenance[name] = createHash("sha256").update(body).digest("hex");
}
await writeFile(
  resolve(destination, "provenance.json"),
  JSON.stringify(
    {
      source: "Mimic runtime docs/optimize",
      sha256: provenance,
      siteAuthored: {
        "results.md": createHash("sha256")
          .update(await readFile(resolve(destination, "results.md")))
          .digest("hex"),
      },
    },
    null,
    2,
  ) + "\n",
);
