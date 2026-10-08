import { createHash } from "node:crypto";

export function releaseFixture(tag = "v9.8.7") {
  const base = `https://github.com/mimic-browser/runtime/releases/download/${tag}`;
  const artifacts = [
    {
      platform: "windows-amd64",
      archive: `mimic-${tag}-windows-amd64.zip`,
      size: 125,
      sha256: "a".repeat(64),
    },
    {
      platform: "linux-amd64",
      archive: `mimic-${tag}-linux-amd64.tar.gz`,
      size: 127,
      sha256: "b".repeat(64),
    },
  ];
  // CRLF remains significant when checking the manifest checksum.
  const manifest = Buffer.from(
    `${JSON.stringify({ version: tag, artifacts }, null, 2).replaceAll("\n", "\r\n")}\r\n`,
  );
  const digest = createHash("sha256").update(manifest).digest("hex");
  const sums = Buffer.from(
    `${artifacts.map((item) => `${item.sha256}  ${item.archive}`).join("\n")}\n${digest}  release-manifest.json\n`,
  );
  const metadata = {
    tag_name: tag,
    draft: false,
    html_url: `https://github.com/mimic-browser/runtime/releases/tag/${tag}`,
    body: `# Mimic **${tag}**\n\nA complete test release. Historical observation: v0.1.9.\n`,
    published_at: "2030-01-01T00:00:00Z",
    updated_at: "2030-01-01T00:00:00Z",
    assets: [
      ...artifacts.map(({ archive: name, size }) => ({ name, size })),
      { name: "release-manifest.json", size: manifest.length },
      { name: "SHA256SUMS", size: sums.length },
    ].map((asset) => ({
      ...asset,
      browser_download_url: `${base}/${asset.name}`,
    })),
  };
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (
      url ===
      `https://api.github.com/repos/mimic-browser/runtime/releases/tags/${tag}`
    )
      return new Response(JSON.stringify(metadata));
    if (url === `${base}/release-manifest.json`) return new Response(manifest);
    if (url === `${base}/SHA256SUMS`) return new Response(sums);
    throw new Error(`Unexpected request: ${url}`);
  };
  return { metadata, manifest, sums, calls, fetcher };
}
