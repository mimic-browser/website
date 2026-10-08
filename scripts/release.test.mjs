import assert from "node:assert/strict";
import { releaseFixture } from "./fixtures/release.mjs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createReleaseData } from "../src/lib/release-data.mjs";
import { syncRelease } from "./sync-release.mjs";

test("one exact version produces a complete coherent release snapshot", async () => {
  const directory = await mkdtemp(join(tmpdir(), "mimic-release-test-"));
  try {
    const destination = join(directory, "release.json");
    const fixture = releaseFixture();
    assert.deepEqual(
      await syncRelease("9.8.7", { destination, fetcher: fixture.fetcher }),
      { tag: "v9.8.7", changed: true },
    );
    const data = createReleaseData(
      JSON.parse(await readFile(destination, "utf8")),
    );
    assert.equal(data.tag, "v9.8.7");
    assert.equal(data.version, "9.8.7");
    assert.equal(
      data.docURL("camera.md"),
      "https://github.com/mimic-browser/runtime/blob/v9.8.7/docs/camera.md",
    );
    assert.equal(data.windows.name, "mimic-v9.8.7-windows-amd64.zip");
    assert.equal(data.linux.name, "mimic-v9.8.7-linux-amd64.tar.gz");
    assert.match(data.release.body, /Historical observation: v0\.1\.9/);
    assert.equal(fixture.calls.length, 3);
    assert.deepEqual(
      await syncRelease(data.tag, { destination, fetcher: fixture.fetcher }),
      { tag: data.tag, changed: false },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

for (const [name, corrupt] of [
  [
    "wrong tag",
    (fixture) => {
      fixture.metadata.tag_name = "v9.8.6";
    },
  ],
  [
    "missing asset",
    (fixture) => {
      fixture.metadata.assets.shift();
    },
  ],
  [
    "archive size disagrees with manifest",
    (fixture) => {
      fixture.metadata.assets[0].size += 1;
    },
  ],
  [
    "wrong asset URL",
    (fixture) => {
      fixture.metadata.assets[0].browser_download_url =
        "https://example.com/download.zip";
    },
  ],
  [
    "duplicate asset",
    (fixture) => {
      fixture.metadata.assets.push(fixture.metadata.assets[0]);
    },
  ],
  [
    "manifest checksum",
    (fixture) => {
      fixture.manifest[10] ^= 1;
    },
  ],
  [
    "draft release",
    (fixture) => {
      fixture.metadata.draft = true;
    },
  ],
]) {
  test(`${name} leaves the previous selected release untouched`, async () => {
    const directory = await mkdtemp(join(tmpdir(), "mimic-release-test-"));
    try {
      const destination = join(directory, "release.json");
      const old = "previous canonical bytes\r\n";
      await writeFile(destination, old);
      const fixture = releaseFixture();
      corrupt(fixture);
      await assert.rejects(
        syncRelease("9.8.7", { destination, fetcher: fixture.fetcher }),
      );
      assert.equal(await readFile(destination, "utf8"), old);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
}

test("version aliases cannot silently choose another release", async () => {
  await assert.rejects(
    syncRelease("latest", {
      fetcher: () => {
        throw new Error("Network must not be reached");
      },
    }),
    /exact release version/,
  );
});
