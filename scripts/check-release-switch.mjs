import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { releaseFixture } from "./fixtures/release.mjs";
import { syncRelease } from "./sync-release.mjs";

// Build in isolation: the selected release and the normal output stay untouched.
const root = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(
  join(tmpdir(), "mimic-website-release-switch-"),
);
const canonical = await readFile(join(root, "public/release-cache.json"));
try {
  for (const path of [
    "src",
    "public",
    "examples",
    "astro.config.mjs",
    "tsconfig.json",
    "package.json",
    "RELEASE_NOTES.md",
    "LICENSE.md",
    "BENCHMARKS.md",
  ]) {
    await cp(join(root, path), join(temporary, path), { recursive: true });
  }
  await symlink(
    join(root, "node_modules"),
    join(temporary, "node_modules"),
    "junction",
  );
  // Keep Astro's virtual component paths inside the isolated root even though
  // the test reuses installed dependencies through a symlink.
  const config = join(temporary, "astro.config.mjs");
  await writeFile(
    config,
    (await readFile(config, "utf8")).replace(
      "vite: {",
      "vite: { resolve: { preserveSymlinks: true },",
    ),
  );
  const fixture = releaseFixture();
  const destination = join(temporary, "public/release-cache.json");
  await syncRelease("9.8.7", { destination, fetcher: fixture.fetcher });
  const build = spawnSync(
    process.execPath,
    [
      join(root, "node_modules/astro/bin/astro.mjs"),
      "build",
      "--root",
      temporary,
    ],
    {
      cwd: temporary,
      encoding: "utf8",
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    },
  );
  assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);
  const check = spawnSync(
    process.execPath,
    [
      join(root, "scripts/check-release.mjs"),
      join(temporary, "dist"),
      destination,
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(check.status, 0, `${check.stdout}\n${check.stderr}`);
  const sdkCheck = spawnSync(
    process.execPath,
    [join(root, "scripts/check-sdk.mjs"), join(temporary, "dist"), destination],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(sdkCheck.status, 0, `${sdkCheck.stdout}\n${sdkCheck.stderr}`);
  assert.deepEqual(
    await readFile(join(root, "public/release-cache.json")),
    canonical,
  );
  assert.deepEqual(
    await readFile(join(temporary, "RELEASE_NOTES.md")),
    await readFile(join(root, "RELEASE_NOTES.md")),
  );
  const historicalGuide = await readFile(
    join(temporary, "dist/playwright-without-chromium/index.html"),
    "utf8",
  );
  assert.match(
    historicalGuide,
    /v0\.1\.9/,
    "historical example version remains unchanged",
  );
  console.log(check.stdout.trim());
  console.log(sdkCheck.stdout.trim());
  console.log(
    "PASS: changing only the release snapshot updates every current-version surface; historical notes and example provenance remain unchanged.",
  );
} finally {
  // This freshly created temporary directory is the only removed tree.
  await rm(temporary, { recursive: true, force: true });
}
