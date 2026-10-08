import { releaseVersion } from "./release";

type Scenario = "launch" | "connect" | "media" | "version";
interface ScriptExample {
  id: Scenario;
  label: string;
  filename: string;
  lang: "javascript" | "typescript" | "python";
  code: string;
  run: string;
  note?: string;
}
interface ScriptClient {
  id: string;
  label: string;
  install: string;
  installTitle?: string;
  installAlternatives?: { label: string; lang: string; code: string }[];
  dependencyInstall?: string;
  sourceInstall?: string;
  examples: ScriptExample[];
}
interface ScriptLanguage {
  id: string;
  label: string;
  clients: ScriptClient[];
}

const scenarioLabels: Record<Scenario, string> = {
  launch: "Launch",
  connect: "Connect",
  media: "Camera & microphone",
  version: "Pin a version",
};
const mediaNote =
  "Requires available camera and microphone sources. The source supplies capture; labels and groups define the devices the site sees.";
const connectNote =
  "Start Mimic on http://127.0.0.1:9222 first. Closing this session disconnects and leaves that runtime running.";

const nodeMedia = `  const context = await session.newContext({
    media: async ({ browserContextId, mimic }) => {
      const { sources } = await mimic.getMediaSources({ browserContextId });
      const choose = (kind) => sources.find(s => s.kind === kind && s.default)
        ?? sources.find(s => s.kind === kind);
      const camera = choose("videoinput");
      const microphone = choose("audioinput");
      if (!camera || !microphone) throw new Error("Capture source unavailable");
      return {
        seed: "meeting-devices",
        devices: [
          {
            key: "camera", kind: "videoinput",
            source: { sourceId: camera.sourceId },
            label: "Studio Camera", group: "desk",
            modes: [{ width: 640, height: 480, frameRate: 30 }],
            defaultMode: { width: 640, height: 480, frameRate: 30 },
            processing: { resize: "crop-and-scale" },
          },
          {
            key: "microphone", kind: "audioinput",
            source: { sourceId: microphone.sourceId },
            label: "Studio Microphone", group: "desk",
          },
        ],
      };
    },
  });`;

function nodeExample(
  client: "playwright" | "puppeteer",
  scenario: Scenario,
): ScriptExample {
  const operation = scenario === "connect" ? "connect" : "launch";
  const start =
    scenario === "connect"
      ? 'connect("http://127.0.0.1:9222")'
      : scenario === "version"
        ? `launch({ runtimeVersion: "${releaseVersion}" })`
        : "launch()";
  const context =
    scenario === "media"
      ? nodeMedia
      : "  const context = await session.newContext();";
  const permissions =
    scenario !== "media"
      ? ""
      : client === "playwright"
        ? `\n  await context.grantPermissions(["camera", "microphone"], { origin: "https://example.com" });`
        : `\n  await context.setPermission("https://example.com",
    { permission: { name: "camera" }, state: "granted" },
    { permission: { name: "microphone" }, state: "granted" },
  );`;
  const output =
    scenario === "media"
      ? `  console.log(await page.evaluate(async () =>
    (await navigator.mediaDevices.enumerateDevices()).map(device => device.toJSON())
  ));`
      : "  console.log(await page.title());";
  const filename = `${scenario}.mjs`;
  return {
    id: scenario,
    label: scenarioLabels[scenario],
    filename,
    lang: "javascript",
    code: `import { ${operation} } from "mimic-browser/${client}";

const session = await ${start};
try {
${context}${permissions}
  const page = await context.newPage();
  await page.goto("https://example.com");
${output}
} finally {
  await session.close();
}`,
    run: `node ${filename}`,
    ...(scenario === "media"
      ? { note: mediaNote }
      : scenario === "connect"
        ? { note: connectNote }
        : {}),
  };
}

const pythonMediaImports = `from mimic.generated import GetMediaSourcesParams, MediaConfiguration, MediaDeviceProfile`;
function pythonMediaFactory(asynchronous: boolean, pyppeteer: boolean): string {
  const permission = pyppeteer
    ? `
    for name in ("camera", "microphone"):
        await session.connection.call_async("Browser.setPermission", {
            "browserContextId": setup.browser_context_id,
            "permission": {"name": name}, "setting": "granted",
            "origin": "https://example.com",
        })`
    : "";
  return `${asynchronous ? "async " : ""}def media(setup):
    result = ${asynchronous ? "await " : ""}setup.mimic.get_media_sources(
        GetMediaSourcesParams(browser_context_id=setup.browser_context_id)
    )
    def choose(kind):
        sources = [source for source in result.sources if source.kind == kind]
        return next((source for source in sources if source.default), sources[0] if sources else None)
    camera = choose("videoinput")
    microphone = choose("audioinput")
    if camera is None or microphone is None:
        raise RuntimeError("Capture source unavailable")${permission}
    return MediaConfiguration(seed="meeting-devices", devices=[
        MediaDeviceProfile(
            key="camera", kind="videoinput", source={"sourceId": camera.source_id},
            label="Studio Camera", group="desk",
            modes=[{"width": 640, "height": 480, "frameRate": 30}],
            default_mode={"width": 640, "height": 480, "frameRate": 30},
            processing={"resize": "crop-and-scale"},
        ),
        MediaDeviceProfile(
            key="microphone", kind="audioinput", source={"sourceId": microphone.source_id},
            label="Studio Microphone", group="desk",
        ),
    ])`;
}

function indent(code: string, spaces: number): string {
  return code
    .split("\n")
    .map((line) => (line ? " ".repeat(spaces) + line : ""))
    .join("\n");
}

function pythonExample(
  client: "playwright" | "playwright_async" | "pyppeteer",
  scenario: Scenario,
): ScriptExample {
  const asynchronous = client !== "playwright";
  const pyppeteer = client === "pyppeteer";
  const operation = scenario === "connect" ? "connect" : "launch";
  const start =
    scenario === "connect"
      ? 'connect("http://127.0.0.1:9222")'
      : scenario === "version"
        ? `launch(runtime_version="${releaseVersion}")`
        : "launch()";
  const wait = asynchronous ? "await " : "";
  const newPage = pyppeteer ? "newPage" : "new_page";
  const context = `context = ${wait}session.new_context(${scenario === "media" ? "media=media" : ""})`;
  const permissions =
    scenario === "media" && !pyppeteer
      ? `\n${wait}context.grant_permissions(["camera", "microphone"], origin="https://example.com")`
      : "";
  const output =
    scenario === "media"
      ? `print(${wait}page.evaluate("async () => (await navigator.mediaDevices.enumerateDevices()).map(device => device.toJSON())"))`
      : `print(${wait}page.title())`;
  const body = `${context}${permissions}
page = ${wait}context.${newPage}()
${wait}page.goto("https://example.com")
${output}`;
  const factory =
    scenario === "media"
      ? `${pythonMediaFactory(asynchronous, pyppeteer)}\n\n`
      : "";
  // Pyppeteer has no native permission helper. Its media factory uses
  // the public SDK connection and the explicit context ID supplied by setup.
  const scopedBody = `${factory}${body}`;
  const filename = `${scenario}.py`;
  const module =
    client === "playwright"
      ? "playwright.sync_api"
      : client === "playwright_async"
        ? "playwright.async_api"
        : "pyppeteer";
  const imports = `${asynchronous ? "import asyncio\n" : ""}from mimic.${module} import ${operation}${scenario === "media" ? `\n${pythonMediaImports}` : ""}`;
  const code = asynchronous
    ? `${imports}

async def main():
    async with await ${start} as session:
${indent(scopedBody, 8)}

asyncio.run(main())`
    : `${imports}

with ${start} as session:
${indent(scopedBody, 4)}`;
  return {
    id: scenario,
    label: scenarioLabels[scenario],
    filename,
    lang: "python",
    code,
    run: `python ${filename}`,
    ...(scenario === "media"
      ? { note: mediaNote }
      : scenario === "connect"
        ? { note: connectNote }
        : {}),
  };
}

const scenarios: Scenario[] = ["launch", "connect", "media", "version"];
function typescriptExample(
  client: "playwright" | "puppeteer",
  scenario: Scenario,
): ScriptExample {
  const example = nodeExample(client, scenario);
  const operation = scenario === "connect" ? "connect" : "launch";
  const body = example.code
    .split("\n")
    .slice(2)
    .join("\n")
    .replace(
      "const choose = (kind)",
      'const choose = (kind: "videoinput" | "audioinput")',
    );
  return {
    ...example,
    filename: `${scenario}.ts`,
    lang: "typescript",
    code: `async function main() {
  const { ${operation} } = await import("mimic-browser/${client}");
${indent(body, 2)}
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});`,
    run: `npx tsx ${scenario}.ts`,
  };
}

export const scriptLanguages: ScriptLanguage[] = [
  {
    id: "javascript",
    label: "JavaScript",
    clients: (["playwright", "puppeteer"] as const).map((client) => ({
      id: client,
      label: client === "playwright" ? "Playwright" : "Puppeteer",
      install: `npm install mimic-browser`,
      dependencyInstall: `npm install ${client}-core@${client === "playwright" ? "1.63.0" : "25.10.0"}`,
      examples: scenarios.map((scenario) => nodeExample(client, scenario)),
    })),
  },
  {
    id: "typescript",
    label: "TypeScript",
    clients: (["playwright", "puppeteer"] as const).map((client) => ({
      id: client,
      label: client === "playwright" ? "Playwright" : "Puppeteer",
      install: `npm install mimic-browser\nnpm install --save-dev typescript tsx @types/node@22`,
      dependencyInstall: `npm install ${client}-core@${client === "playwright" ? "1.63.0" : "25.10.0"}`,
      examples: scenarios.map((scenario) =>
        typescriptExample(client, scenario),
      ),
    })),
  },
  {
    id: "python",
    label: "Python",
    clients: (["playwright", "playwright_async", "pyppeteer"] as const).map(
      (client) => ({
        id:
          client === "playwright"
            ? "playwright-sync"
            : client === "playwright_async"
              ? "playwright-async"
              : "pyppeteer",
        label:
          client === "playwright"
            ? "Playwright · sync"
            : client === "playwright_async"
              ? "Playwright · async"
              : "Pyppeteer",
        install: `python3 -m venv .venv\nsource .venv/bin/activate\npython -m pip install mimic-browser`,
        installTitle: "Linux / macOS · bash or zsh",
        installAlternatives: [
          {
            label: "Windows · PowerShell",
            lang: "powershell",
            code: `python -m venv .venv\n.\\.venv\\Scripts\\Activate.ps1\npython -m pip install mimic-browser`,
          },
          {
            label: "Windows · Command Prompt",
            lang: "bat",
            code: `python -m venv .venv\n.venv\\Scripts\\activate.bat\npython -m pip install mimic-browser`,
          },
        ],
        dependencyInstall: `python -m pip install ${client === "pyppeteer" ? "pyppeteer==2.0.0" : "playwright==1.63.0"}`,
        examples: scenarios.map((scenario) => pythonExample(client, scenario)),
      }),
    ),
  },
];
