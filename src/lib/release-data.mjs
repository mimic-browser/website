const repository = "https://github.com/mimic-browser/runtime";

/** @typedef {{name: string, browser_download_url: string, size: number}} ReleaseAsset */
/** @typedef {{tag_name: string, html_url: string, published_at: string, updated_at: string, body: string, assets: ReleaseAsset[]}} Release */

/** @param {string} value */
export function normalizeVersion(value) {
  if (
    !/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(
      value,
    )
  ) {
    throw new Error("Choose an exact release version, such as v1.2.3.");
  }
  return value.startsWith("v") ? value : `v${value}`;
}

/** One complete release drives every current-version surface at build time.
 * @param {unknown} value
 * @param {string=} requestedVersion
 */
export function createReleaseData(value, requestedVersion) {
  if (!value || typeof value !== "object")
    throw new Error("Invalid release metadata");
  const release = /** @type {Release & {draft?: boolean}} */ (value);
  const tag = normalizeVersion(release.tag_name);
  if (
    tag !== release.tag_name ||
    (requestedVersion && tag !== normalizeVersion(requestedVersion))
  ) {
    throw new Error("Release tag does not match the selected version");
  }
  if (
    release.draft ||
    release.html_url !== `${repository}/releases/tag/${tag}` ||
    !Number.isFinite(Date.parse(release.published_at)) ||
    !Number.isFinite(Date.parse(release.updated_at)) ||
    typeof release.body !== "string" ||
    !release.body.trim() ||
    !Array.isArray(release.assets)
  ) {
    throw new Error("Incomplete or unpublished release metadata");
  }
  const baseURL = `${repository}/releases/download/${tag}`;
  const names = new Set();
  for (const asset of release.assets) {
    if (
      !asset ||
      typeof asset.name !== "string" ||
      !/^[A-Za-z0-9_.-]+$/.test(asset.name) ||
      names.has(asset.name) ||
      asset.browser_download_url !== `${baseURL}/${asset.name}` ||
      !Number.isSafeInteger(asset.size) ||
      asset.size <= 0
    ) {
      throw new Error(
        "Release contains an invalid, duplicate or mismatched asset",
      );
    }
    names.add(asset.name);
  }
  /** @param {string} name */
  const asset = (name) => {
    const match = release.assets.find((item) => item.name === name);
    if (!match) throw new Error(`Release is missing ${name}`);
    return match;
  };
  const windows = asset(`mimic-${tag}-windows-amd64.zip`);
  const linux = asset(`mimic-${tag}-linux-amd64.tar.gz`);
  const checksums = asset("SHA256SUMS");
  const manifest = asset("release-manifest.json");
  return {
    release,
    tag,
    version: tag.slice(1),
    windows,
    linux,
    checksums,
    manifest,
    /** @param {string} path */
    docURL(path) {
      if (
        !/^[A-Za-z0-9_./-]+\.md$/.test(path) ||
        path.includes("..") ||
        path.startsWith("/")
      ) {
        throw new Error("Invalid documentation path");
      }
      return `${repository}/blob/${tag}/docs/${path}`;
    },
  };
}
