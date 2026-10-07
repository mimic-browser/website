# Quick start: launch Mimic, then automate

**Public Beta — Windows and Linux.** [Download v0.2.1](https://github.com/mimic-browser/runtime/releases/tag/v0.2.1), verify the archive against its `SHA256SUMS`, and extract it. The executable requires no Go, Rust, Chromium or GPU. Read [Prosperity Public License 3.0.0](LICENSE.md) before use.

Windows: run `mimic.exe`. Linux: run `./mimic` on Ubuntu 24.04+ with glibc 2.39+, libgcc_s and installed Liberation/DejaVu/Noto fonts. Node.js 22+ is only needed for automation clients.

## Start the browser runtime

```powershell
.\mimic.exe --listen 127.0.0.1:9222
```

```sh
./mimic --listen 127.0.0.1:9222
```

The local CDP endpoint is unauthenticated; keep it accessible to trusted clients. `--dev-preview` optionally exposes a passive viewer at `/debug/preview/`, with themes, fit/zoom controls and live activity. It does not render a window inside Mimic or send viewer input to the automated Page.

## Connect Playwright

```sh
npm install playwright-core
```

```js
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
try {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.goto("https://books.toscrape.com/", { waitUntil: "load" });
  console.log(await page.locator("h1").textContent());
  await page.close();
} finally {
  await browser.close();
}
```

The extracted archive includes [runnable local examples](examples/README.md) for Playwright, Puppeteer, concurrent Pages and isolated profile contexts. Use ordinary assertions and application readiness signals; a load event alone does not establish hydration.

## Camera and microphone

On a secure page or localhost, grant access through CDP before requesting capture:

```js
const cdp = await context.newCDPSession(page);
for (const name of ["camera", "microphone"]) {
  await cdp.send("Browser.setPermission", {
    permission: { name },
    setting: "granted",
    origin: new URL(page.url()).origin,
  });
}
await page.evaluate(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  globalThis.capture = stream;
  const peer = new RTCPeerConnection();
  for (const track of stream.getTracks()) peer.addTrack(track, stream);
  // Exchange SDP and ICE through the application's signaling service.
  globalThis.peer = peer;
});
```

Use `enumerateDevices()` and an exact `deviceId` to select OBS Virtual Camera or a particular audio input. Capture is lazy, clones share the source, and navigation/Page teardown close native resources. Unset or denied permission rejects immediately without a waiting dialog.

WebRTC supports H264 video up to 1280×720 at 30 fps and Opus audio from 48 kHz mono/stereo microphone PCM. Echo/noise/gain/voice processing and speaker output are unavailable. See the [capture contract](https://github.com/mimic-browser/runtime/blob/v0.2.1/docs/camera.md) and [release notes](RELEASE_NOTES.md).

## Separate environments and proxies

Create managed environments through the current CDP profile contract:

```js
const { browserContextId, profile } = await cdp.send("Mimic.createContext", {
  profile: {
    generate: { browser: "chrome", version: 152, platform: "windows", seed: "account-1842" },
  },
  proxy: { server: "socks5://127.0.0.1:1080", username: "user", password: "password" },
  disposeOnDetach: true,
});
try {
  const { targetId } = await cdp.send("Target.createTarget", {
    browserContextId,
    url: "about:blank",
  });
  // Attach to targetId and automate it through Page/Runtime commands.
} finally {
  await cdp.send("Target.disposeBrowserContext", { browserContextId });
}
```

The returned `profile` is an opaque reusable token. Use `Mimic.exportProfile` and `Mimic.importProfile` for JSON. Generated/imported environments are immutable; create a new Context to change them. JSON is not a CLI environment configuration or an arbitrary createContext override. Proxy credentials are separate Context options; HTTP(S) proxy routing does not route UDP/WebRTC. See the [Context contract](https://github.com/mimic-browser/runtime/blob/v0.2.1/docs/environment-profiles.md).

## Workload optimization

`mimic optimize --name shop -- <command>` trains a named workload profile using the command's own assertions. `--profile shop` selects that workload artifact, not environment JSON. Read [Optimize and its safety limits](https://mimic.boo/docs/optimize/) before applying it.
