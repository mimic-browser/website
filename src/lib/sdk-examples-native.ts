import { sdkVersion } from "./sdk-release";
import type { SdkExample, SdkLanguage } from "./sdk-examples";
import { releaseVersion } from "./release";

const connectNote =
  "Start Mimic on http://127.0.0.1:9222 before running this example. Closing the SDK session leaves that runtime running.";
const mediaNote =
  "Uses your default camera and microphone, or the first available source of each kind. To select OBS, choose its video source by label. The site sees Studio Camera and Studio Microphone; only example.com receives capture permission, and every track is stopped.";

const capture = `(async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const camera = devices.find(device => device.label === "Studio Camera");
  const microphone = devices.find(device => device.label === "Studio Microphone");
  if (!camera || !microphone) throw new Error("Configured devices unavailable");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: camera.deviceId } },
    audio: { deviceId: { exact: microphone.deviceId } }
  });
  try {
    return stream.getTracks().map(track => ({
      label: track.label, settings: track.getSettings()
    }));
  } finally {
    stream.getTracks().forEach(track => track.stop());
  }
})()`;

const goMediaFactory = `func mediaFor(ctx context.Context, setup mimic.ContextSetup) (mimic.MediaConfiguration, error) {
    found, err := setup.Mimic.GetMediaSources(ctx, mimic.GetMediaSourcesParams{
        BrowserContextId: mimic.Some(setup.BrowserContextID),
    })
    if err != nil { return mimic.MediaConfiguration{}, err }
    var camera, microphone *mimic.MediaSource
    for i := range found.Sources {
        source := &found.Sources[i]
        if source.Kind == "videoinput" && (camera == nil || source.Default) { camera = source }
        if source.Kind == "audioinput" && (microphone == nil || source.Default) { microphone = source }
    }
    if camera == nil || microphone == nil {
        return mimic.MediaConfiguration{}, fmt.Errorf("connect a camera and microphone before starting capture")
    }
    cameraSource, err := json.Marshal(map[string]string{"sourceId": camera.SourceId})
    if err != nil { return mimic.MediaConfiguration{}, err }
    microphoneSource, err := json.Marshal(map[string]string{"sourceId": microphone.SourceId})
    if err != nil { return mimic.MediaConfiguration{}, err }
    return mimic.MediaConfiguration{
        Seed: mimic.Some("meeting-devices"),
        Devices: mimic.Some([]mimic.MediaDeviceProfile{
            {Key: "camera", Kind: "videoinput", Label: "Studio Camera",
                Group: mimic.Some("desk"), Source: cameraSource,
                Modes: mimic.Some([]mimic.CameraFormat{{Width: 1280, Height: 720, FrameRate: 30}}),
                DefaultMode: mimic.Some(mimic.CameraFormat{Width: 1280, Height: 720, FrameRate: 30}),
                Processing: mimic.Some(mimic.MediaProcessing{Resize: mimic.Some("crop-and-scale")})},
            {Key: "microphone", Kind: "audioinput", Label: "Studio Microphone",
                Group: mimic.Some("desk"), Source: microphoneSource},
        }),
    }, nil
}`;

function goExample(client: "rod" | "chromedp", scenario: string): string {
  const media = scenario === "media";
  const connected = scenario === "connect";
  const options =
    scenario === "version"
      ? `mimic.RuntimeOptions{Version: "${releaseVersion}"}`
      : "mimic.RuntimeOptions{}";
  const open = connected
    ? `sdk.Connect(ctx, "http://127.0.0.1:9222")`
    : media && client === "chromedp"
      ? `sdk.LaunchConfiguredWithMedia(ctx, ${options}, mimic.ConfigureContextParams{}, factory)`
      : `sdk.Launch(ctx, ${options})`;
  const imports =
    client === "rod"
      ? `"github.com/go-rod/rod/lib/proto"`
      : `"github.com/chromedp/chromedp"${media ? '\n    cdpruntime "github.com/chromedp/cdproto/runtime"' : ""}`;
  const rodFlow = `browser, err := session.${media ? "NewConfiguredContextWithMedia(ctx, mimic.ConfigureContextParams{}, mediaFor)" : "NewContext(ctx, nil, nil)"}
    if err != nil { return err }
    ${
      media
        ? `if err := session.Mimic.Call(ctx, "Browser.grantPermissions", map[string]any{
        "browserContextId": string(browser.BrowserContextID), "origin": "https://example.com",
        "permissions": []string{"videoCapture", "audioCapture"},
    }, nil); err != nil { return err }
    `
        : ""
    }page, err := browser.Page(proto.TargetCreateTarget{URL: "https://example.com"})
    if err != nil { return err }
    if err := page.WaitLoad(); err != nil { return err }
    result, err := page.Eval(${media ? '"() => " + `' + capture + "`" : '"() => document.title"'})
    if err != nil { return err }
    fmt.Println(result.Value)`;
  const chromedpFlow = media
    ? `if err := session.Mimic.Call(ctx, "Browser.grantPermissions", map[string]any{
        "browserContextId": contextID, "origin": "https://example.com",
        "permissions": []string{"videoCapture", "audioCapture"},
    }, nil); err != nil { return err }
    var tracks []map[string]any
    if err := chromedp.Run(session.Context,
        chromedp.Navigate("https://example.com"),
        chromedp.Evaluate(\`${capture}\`, &tracks,
            func(params *cdpruntime.EvaluateParams) *cdpruntime.EvaluateParams {
                return params.WithAwaitPromise(true)
            }),
    ); err != nil { return err }
    fmt.Println(tracks)`
    : `var title string
    if err := chromedp.Run(session.Context,
        chromedp.Navigate("https://example.com"),
        chromedp.Title(&title),
    ); err != nil { return err }
    fmt.Println(title)`;
  return `package main

import (
    "context"
    ${media ? '"encoding/json"\n    ' : ""}"fmt"
    "log"
    "time"

    ${imports}
    ${!connected || media ? `mimic "github.com/mimic-browser/sdk/go"\n    ` : ""}sdk "github.com/mimic-browser/sdk/go/${client}"
)

func main() {
    if err := run(); err != nil { log.Fatal(err) }
}

func run() error {
    ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
    defer cancel()
    ${
      media && client === "chromedp"
        ? `var contextID string
    factory := func(ctx context.Context, setup mimic.ContextSetup) (mimic.MediaConfiguration, error) {
        contextID = setup.BrowserContextID
        return mediaFor(ctx, setup)
    }
    `
        : ""
    }session, err := ${open}
    if err != nil { return err }
    defer session.Close()

    ${client === "rod" ? rodFlow : chromedpFlow}
    return nil
}
${media ? "\n" + goMediaFactory + "\n" : ""}`;
}

function rustExample(scenario: string): string {
  const media = scenario === "media";
  const connected = scenario === "connect";
  const open = connected
    ? 'Session::connect("http://127.0.0.1:9222").await?'
    : scenario === "version"
      ? `Session::launch(RuntimeOptions {
        version: Some("${releaseVersion}".into()),
        ..Default::default()
    }).await?`
      : "Session::launch(RuntimeOptions::default()).await?";
  const mediaFlow = `let context = session.new_context_with_media(
            ConfigureContextParams::default(),
            |setup| async move {
                let found = setup.mimic.get_media_sources(GetMediaSourcesParams {
                    browser_context_id: WireOptional::Value(setup.browser_context_id),
                }).await?;
                let camera = found.sources.iter().find(|source|
                    source.kind == "videoinput" && source.default
                ).or_else(|| found.sources.iter().find(|source| source.kind == "videoinput"))
                 .ok_or_else(|| Error::Invalid("No camera is available".into()))?;
                let microphone = found.sources.iter().find(|source|
                    source.kind == "audioinput" && source.default
                ).or_else(|| found.sources.iter().find(|source| source.kind == "audioinput"))
                 .ok_or_else(|| Error::Invalid("No microphone is available".into()))?;
                Ok(serde_json::from_value::<MediaConfiguration>(json!({
                    "seed": "meeting-devices",
                    "devices": [
                        {"key":"camera", "kind":"videoinput", "label":"Studio Camera",
                         "group":"desk",
                         "modes":[{"width":1280,"height":720,"frameRate":30}],
                         "defaultMode":{"width":1280,"height":720,"frameRate":30},
                         "processing":{"resize":"crop-and-scale"},
                         "source":{"sourceId":camera.source_id}},
                        {"key":"microphone", "kind":"audioinput", "label":"Studio Microphone",
                         "group":"desk", "source":{"sourceId":microphone.source_id}}
                    ]
                }))?)
            },
        ).await?;
        session.mimic.call("Browser.grantPermissions", Some(json!({
            "browserContextId": context.as_ref(), "origin": "https://example.com",
            "permissions": ["videoCapture", "audioCapture"]
        }))).await?;
        let page = session.browser.new_page(CreateTargetParams::builder()
            .url("about:blank")
            .browser_context_id(context)
            .build()?
        ).await?;
        page.goto("https://example.com").await?;
        let tracks: serde_json::Value = page.evaluate(r#"${capture}"#).await?.into_value()?;
        println!("{tracks}");
        page.close().await?;`;
  return `use mimic_browser::{chromiumoxide::Session${connected ? "" : ", RuntimeOptions"}${media ? ", Error" : ""}};
use mimic_browser::generated::{ConfigureContextParams${media ? ", GetMediaSourcesParams, MediaConfiguration, WireOptional" : ""}};
use chromiumoxide::cdp::browser_protocol::target::CreateTargetParams;
${media ? "use serde_json::json;\n" : ""}
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut session = ${open};
    let result: Result<(), Box<dyn std::error::Error>> = async {
        ${
          media
            ? mediaFlow
            : `let context = session.new_context(ConfigureContextParams::default()).await?;
        let page = session.browser.new_page(CreateTargetParams::builder()
            .url("about:blank")
            .browser_context_id(context)
            .build()?
        ).await?;
        page.goto("https://example.com").await?;
        let title: String = page.evaluate("document.title").await?.into_value()?;
        println!("{title}");
        page.close().await?;`
        }
        Ok(())
    }.await;
    let closed = session.close().await;
    result?;
    closed?;
    Ok(())
}
`;
}

function rubyExample(scenario: string): string {
  const media = scenario === "media";
  const open =
    scenario === "connect"
      ? 'connect("http://127.0.0.1:9222")'
      : scenario === "version"
        ? `launch(runtime_version: "${releaseVersion}")`
        : "launch";
  return `${media ? 'require "json"\n' : ""}require "mimic_sdk/ferrum"

MimicSDK::Ferrum.${open} do |session|
  ${
    media
      ? `context = session.new_context(media: lambda do |setup|
    sources = setup.mimic.get_media_sources({
      "browserContextId" => setup.browser_context_id
    }).sources
    cameras = sources.select { |source| source.kind == "videoinput" }
    microphones = sources.select { |source| source.kind == "audioinput" }
    camera = cameras.find(&:default) || cameras.first
    microphone = microphones.find(&:default) || microphones.first
    raise "Connect a camera and microphone before starting capture" unless camera && microphone
    {
      "seed" => "meeting-devices",
      "devices" => [
        {"key" => "camera", "kind" => "videoinput", "label" => "Studio Camera",
         "group" => "desk",
         "modes" => [{"width" => 1280, "height" => 720, "frameRate" => 30}],
         "defaultMode" => {"width" => 1280, "height" => 720, "frameRate" => 30},
         "processing" => {"resize" => "crop-and-scale"},
         "source" => {"sourceId" => camera.source_id}},
        {"key" => "microphone", "kind" => "audioinput", "label" => "Studio Microphone",
         "group" => "desk", "source" => {"sourceId" => microphone.source_id}}
      ]
    }
  end)
  session.mimic.call("Browser.grantPermissions", {
    "browserContextId" => context.id, "origin" => "https://example.com",
    "permissions" => ["videoCapture", "audioCapture"]
  })
  page = context.create_page
  page.go_to("https://example.com")
  observed = page.evaluate_async(<<~JS, 15)
    const done = arguments[0];
    ${capture}.then(tracks => done({tracks}))
      .catch(error => done({error: error.message}));
  JS
  raise observed.fetch("error") if observed.key?("error")
  puts JSON.pretty_generate(observed.fetch("tracks"))`
      : `context = session.new_context
  page = context.create_page
  page.go_to("https://example.com")
  puts page.title`
  }
end
`;
}

const scenarios = [
  ["launch", "Launch"],
  ["connect", "Connect"],
  ["media", "Camera & microphone"],
  ["version", "Pin a version"],
] as const;

function examples(
  filename: string,
  lang: string,
  run: string,
  code: (scenario: string) => string,
): SdkExample[] {
  return scenarios.map(([id, label]) => ({
    id,
    label,
    filename,
    lang,
    code: code(id),
    run,
    note:
      id === "media" ? mediaNote : id === "connect" ? connectNote : undefined,
  }));
}

export const nativeLanguages: SdkLanguage[] = [
  {
    id: "go",
    label: "Go",
    clients: [
      {
        id: "rod",
        label: "Rod",
        install: `mkdir mimic-example\ncd mimic-example\ngo mod init example.com/mimic-example\ngo get github.com/mimic-browser/sdk/go/rod@v${sdkVersion}`,
        dependencyInstall: "go get github.com/go-rod/rod@v0.116.2",
        examples: examples("main.go", "go", "go run .", (scenario) =>
          goExample("rod", scenario),
        ),
      },
      {
        id: "chromedp",
        label: "chromedp",
        install: `mkdir mimic-example\ncd mimic-example\ngo mod init example.com/mimic-example\ngo get github.com/mimic-browser/sdk/go/chromedp@v${sdkVersion}`,
        dependencyInstall: "go get github.com/chromedp/chromedp@v0.15.1",
        examples: examples("main.go", "go", "go run .", (scenario) =>
          goExample("chromedp", scenario),
        ),
      },
    ],
  },
  {
    id: "rust",
    label: "Rust",
    clients: [
      {
        id: "chromiumoxide",
        label: "chromiumoxide",
        install: `cargo new mimic-example\ncd mimic-example\ncargo add mimic-browser@${sdkVersion} --features chromiumoxide\ncargo add serde_json@1\ncargo add tokio@1 --features macros,rt-multi-thread`,
        dependencyInstall: "cargo add chromiumoxide@0.9.1",
        examples: examples("src/main.rs", "rust", "cargo run", rustExample),
      },
    ],
  },
  {
    id: "ruby",
    label: "Ruby",
    clients: [
      {
        id: "ferrum",
        label: "Ferrum",
        install: `gem install mimic-browser --version ${sdkVersion}`,
        dependencyInstall: "gem install ferrum --version 0.18.0",
        examples: examples("scrape.rb", "ruby", "ruby scrape.rb", rubyExample),
      },
    ],
  },
];
