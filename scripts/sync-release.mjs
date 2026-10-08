import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  createReleaseData,
  normalizeVersion,
} from "../src/lib/release-data.mjs";

const defaultDestination = fileURLToPath(
  new URL("../public/release-cache.json", import.meta.url),
);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function verifyManifest(data, manifestBytes, sumsBytes) {
  const sums = new Map();
  for (const line of sumsBytes.toString("utf8").trim().split(/\r?\n/)) {
    const match = /^([a-fA-F0-9]{64})\s+\*?([A-Za-z0-9_.-]+)$/.exec(line);
    if (!match || sums.has(match[2]))
      throw new Error("Invalid or duplicate checksum entry");
    sums.set(match[2], match[1].toLowerCase());
  }
  if (hash(manifestBytes) !== sums.get(data.manifest.name))
    throw new Error("Release manifest checksum mismatch");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  if (manifest.version !== data.tag || !Array.isArray(manifest.artifacts))
    throw new Error("Release manifest version mismatch");
  for (const [platform, asset] of [
    ["windows-amd64", data.windows],
    ["linux-amd64", data.linux],
  ]) {
    const artifacts = manifest.artifacts.filter(
      (item) => item.platform === platform,
    );
    if (artifacts.length !== 1)
      throw new Error(`Manifest requires exactly one ${platform} artifact`);
    const artifact = artifacts[0];
    if (
      artifact.archive !== asset.name ||
      artifact.size !== asset.size ||
      !/^[a-f0-9]{64}$/.test(artifact.sha256) ||
      artifact.sha256 !== sums.get(asset.name)
    ) {
      throw new Error(`Release artifact metadata mismatch: ${platform}`);
    }
  }
}

export async function syncRelease(
  version,
  { destination = defaultDestination, fetcher = fetch } = {},
) {
  const tag = normalizeVersion(version);
  async function get(url, maximumBytes) {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "mimic-website-release-sync",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`Release request failed: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maximumBytes)
      throw new Error("Release metadata exceeds the size limit");
    return bytes;
  }
  const metadata = JSON.parse(
    (
      await get(
        `https://api.github.com/repos/mimic-browser/runtime/releases/tags/${tag}`,
        2_000_000,
      )
    ).toString("utf8"),
  );
  const data = createReleaseData(metadata, tag);
  const [manifest, sums] = await Promise.all([
    get(data.manifest.browser_download_url, 1_000_000),
    get(data.checksums.browser_download_url, 100_000),
  ]);
  if (
    manifest.length !== data.manifest.size ||
    sums.length !== data.checksums.size
  )
    throw new Error("Release metadata size mismatch");
  verifyManifest(data, manifest, sums);
  const selected = {
    assets: data.release.assets.map(({ name, browser_download_url, size }) => ({
      name,
      browser_download_url,
      size,
    })),
    body: data.release.body,
    html_url: data.release.html_url,
    published_at: data.release.published_at,
    updated_at: data.release.updated_at,
    tag_name: data.tag,
  };
  const content = `${JSON.stringify(selected, null, 2)}\n`;
  let previous;
  try {
    previous = await readFile(destination, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (previous === content) return { tag, changed: false };
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: "wx" });
    // Publish only after the entire descriptor and manifest have been verified.
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
  return { tag, changed: true };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--version") {
    console.error("Usage: npm run release:sync -- --version <exact-version>");
    process.exitCode = 1;
  } else {
    try {
      const result = await syncRelease(args[1]);
      console.log(
        `${result.tag}: ${result.changed ? "release snapshot updated" : "already current"}. Run npm run build to update every page.`,
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
