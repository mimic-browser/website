import { sdkMavenGroupId, sdkVersion } from "./sdk-release";
import { releaseVersion } from "./release";
import type { SdkLanguage } from "./sdk-examples";

export const managedLanguages: SdkLanguage[] = [
  {
    id: "csharp",
    label: "C# / .NET",
    clients: [
      {
        id: "playwright",
        label: "Playwright",
        install: `dotnet new console -n MimicDemo --framework net8.0
cd MimicDemo
dotnet add package mimic-browser.Playwright --version ${sdkVersion}`,
        examples: [
          {
            id: "launch",
            label: "Launch",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.Playwright;
using Mimic.Sdk;

await using var session = await PlaywrightSession.LaunchAsync();
var context = await session.NewContextAsync();
var page = await context.NewPageAsync();
await page.GotoAsync("https://example.com");
Console.WriteLine(await page.TitleAsync());`,
            run: "dotnet run",
          },
          {
            id: "connect",
            label: "Connect",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.Playwright;
using Mimic.Sdk;

await using var session = await PlaywrightSession.ConnectAsync("http://127.0.0.1:9222");
var context = await session.NewContextAsync();
var page = await context.NewPageAsync();
await page.GotoAsync("https://example.com");
Console.WriteLine(await page.TitleAsync());`,
            run: "dotnet run",
            note: "Connects to Mimic already listening at http://127.0.0.1:9222. Closing this session preserves the external runtime.",
          },
          {
            id: "version",
            label: "Pin a version",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.Playwright;
using Mimic.Sdk;

await using var session = await PlaywrightSession.LaunchAsync(new RuntimeOptions { Version = "${releaseVersion}" });
var context = await session.NewContextAsync();
var page = await context.NewPageAsync();
await page.GotoAsync("https://example.com");
Console.WriteLine(await page.TitleAsync());`,
            run: "dotnet run",
            note: "The exact runtime version is downloaded once, verified and reused from the OS cache.",
          },
          {
            id: "media",
            label: "Camera & microphone",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.Playwright;
using Mimic.Sdk;
using Mimic.Sdk.Generated;
using System.Text.Json.Nodes;

await using var session = await PlaywrightSession.LaunchAsync();
var context = await session.NewContextAsync(mediaFactory: async (setup, token) =>
{
    var result = await setup.Mimic.Commands.GetMediaSourcesAsync(
        new() { BrowserContextId = Optional<string>.Of(setup.BrowserContextId) }, token);
    var camera = result.Sources.FirstOrDefault(source => source.Kind == "videoinput")
        ?? throw new InvalidOperationException("No camera source is available");
    var microphone = result.Sources.FirstOrDefault(source => source.Kind == "audioinput")
        ?? throw new InvalidOperationException("No microphone source is available");
    var mode = new CameraFormat { Width = 1280, Height = 720, FrameRate = 30 };
    return new MediaConfiguration
    {
        Devices = Optional<List<MediaDeviceProfile>>.Of([
            new() {
                Key = "camera", Kind = "videoinput", Label = "Studio Camera",
                Source = new JsonObject { ["sourceId"] = camera.SourceId },
                Group = Optional<string>.Of("desk"),
                Modes = Optional<List<CameraFormat>>.Of([mode]),
                DefaultMode = Optional<CameraFormat>.Of(mode),
                Processing = Optional<MediaProcessing>.Of(new()
                { Resize = Optional<string>.Of("crop-and-scale") })
            },
            new() {
                Key = "microphone", Kind = "audioinput", Label = "Studio Microphone",
                Source = new JsonObject { ["sourceId"] = microphone.SourceId },
                Group = Optional<string>.Of("desk")
            }
        ])
    };
});
var capabilities = await session.ForContextAsync(context);
await session.Mimic.SendAsync("Browser.grantPermissions", new JsonObject
{
    ["browserContextId"] = capabilities.Id,
    ["origin"] = "https://example.com",
    ["permissions"] = new JsonArray("videoCapture", "audioCapture")
});
var page = await context.NewPageAsync();
await page.GotoAsync("https://example.com");
Console.WriteLine(await page.EvaluateAsync<string>("""
    async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const camera = devices.find(device => device.label === "Studio Camera");
      const microphone = devices.find(device => device.label === "Studio Microphone");
      if (!camera || !microphone) throw new Error("Configured media is unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: camera.deviceId } },
        audio: { deviceId: { exact: microphone.deviceId } }
      });
      try {
        return JSON.stringify(stream.getTracks().map(track => ({
          kind: track.kind, label: track.label, state: track.readyState
        })));
      } finally {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    """));`,
            run: "dotnet run",
            note: "Requires accessible camera and microphone sources. Source IDs stay private; the page receives Studio Camera and Studio Microphone identities. This example opens capture and stops every track.",
          },
        ],
      },
      {
        id: "puppeteersharp",
        label: "PuppeteerSharp",
        install: `dotnet new console -n MimicDemo --framework net8.0
cd MimicDemo
dotnet add package mimic-browser.PuppeteerSharp --version ${sdkVersion}`,
        examples: [
          {
            id: "launch",
            label: "Launch",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.PuppeteerSharp;
using Mimic.Sdk;

await using var session = await PuppeteerSession.LaunchAsync();
var context = await session.NewContextAsync();
var page = await context.NewPageAsync();
await page.GoToAsync("https://example.com");
Console.WriteLine(await page.GetTitleAsync());`,
            run: "dotnet run",
          },
          {
            id: "connect",
            label: "Connect",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.PuppeteerSharp;
using Mimic.Sdk;

await using var session = await PuppeteerSession.ConnectAsync("http://127.0.0.1:9222");
var context = await session.NewContextAsync();
var page = await context.NewPageAsync();
await page.GoToAsync("https://example.com");
Console.WriteLine(await page.GetTitleAsync());`,
            run: "dotnet run",
            note: "Connects to Mimic already listening at http://127.0.0.1:9222. Closing this session preserves the external runtime.",
          },
          {
            id: "version",
            label: "Pin a version",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.PuppeteerSharp;
using Mimic.Sdk;

await using var session = await PuppeteerSession.LaunchAsync(new RuntimeOptions { Version = "${releaseVersion}" });
var context = await session.NewContextAsync();
var page = await context.NewPageAsync();
await page.GoToAsync("https://example.com");
Console.WriteLine(await page.GetTitleAsync());`,
            run: "dotnet run",
            note: "The exact runtime version is downloaded once, verified and reused from the OS cache.",
          },
          {
            id: "media",
            label: "Camera & microphone",
            filename: "Program.cs",
            lang: "csharp",
            code: `using Mimic.PuppeteerSharp;
using Mimic.Sdk;
using Mimic.Sdk.Generated;
using System.Text.Json.Nodes;

await using var session = await PuppeteerSession.LaunchAsync();
var context = await session.NewContextAsync(mediaFactory: async (setup, token) =>
{
    var result = await setup.Mimic.Commands.GetMediaSourcesAsync(
        new() { BrowserContextId = Optional<string>.Of(setup.BrowserContextId) }, token);
    var camera = result.Sources.FirstOrDefault(source => source.Kind == "videoinput")
        ?? throw new InvalidOperationException("No camera source is available");
    var microphone = result.Sources.FirstOrDefault(source => source.Kind == "audioinput")
        ?? throw new InvalidOperationException("No microphone source is available");
    var mode = new CameraFormat { Width = 1280, Height = 720, FrameRate = 30 };
    return new MediaConfiguration
    {
        Devices = Optional<List<MediaDeviceProfile>>.Of([
            new() {
                Key = "camera", Kind = "videoinput", Label = "Studio Camera",
                Source = new JsonObject { ["sourceId"] = camera.SourceId },
                Group = Optional<string>.Of("desk"),
                Modes = Optional<List<CameraFormat>>.Of([mode]),
                DefaultMode = Optional<CameraFormat>.Of(mode),
                Processing = Optional<MediaProcessing>.Of(new()
                { Resize = Optional<string>.Of("crop-and-scale") })
            },
            new() {
                Key = "microphone", Kind = "audioinput", Label = "Studio Microphone",
                Source = new JsonObject { ["sourceId"] = microphone.SourceId },
                Group = Optional<string>.Of("desk")
            }
        ])
    };
});
var capabilities = session.ForContext(context);
await session.Mimic.SendAsync("Browser.grantPermissions", new JsonObject
{
    ["browserContextId"] = capabilities.Id,
    ["origin"] = "https://example.com",
    ["permissions"] = new JsonArray("videoCapture", "audioCapture")
});
var page = await context.NewPageAsync();
await page.GoToAsync("https://example.com");
Console.WriteLine(await page.EvaluateFunctionAsync<string>("""
    async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const camera = devices.find(device => device.label === "Studio Camera");
      const microphone = devices.find(device => device.label === "Studio Microphone");
      if (!camera || !microphone) throw new Error("Configured media is unavailable");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: camera.deviceId } },
        audio: { deviceId: { exact: microphone.deviceId } }
      });
      try {
        return JSON.stringify(stream.getTracks().map(track => ({
          kind: track.kind, label: track.label, state: track.readyState
        })));
      } finally {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    """));`,
            run: "dotnet run",
            note: "Requires accessible camera and microphone sources. Source IDs stay private; the page receives Studio Camera and Studio Microphone identities. This example opens capture and stops every track.",
          },
        ],
      },
    ],
  },
  {
    id: "java",
    label: "Java",
    clients: [
      {
        id: "playwright",
        label: "Playwright",
        install: `mkdir mimic-java-demo
cd mimic-java-demo
mkdir src
mkdir src/main
mkdir src/main/java`,
        examples: [
          {
            id: "launch",
            label: "Launch",
            code: `import io.mimicbrowser.sdk.RuntimeOptions;
import io.mimicbrowser.sdk.playwright.PlaywrightSession;

public class Main {
    public static void main(String[] args) {
        try (var session = PlaywrightSession.launch(new RuntimeOptions())) {
            var context = session.newContext();
            var page = context.newPage();
            page.navigate("https://example.com");
            System.out.println(page.title());
        }
    }
}`,
            filename: "src/main/java/Main.java",
            lang: "java",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.14.1</version>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>Main</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
          {
            id: "connect",
            label: "Connect",
            code: `import io.mimicbrowser.sdk.RuntimeOptions;
import io.mimicbrowser.sdk.playwright.PlaywrightSession;

public class Main {
    public static void main(String[] args) {
        try (var session = PlaywrightSession.connect("http://127.0.0.1:9222")) {
            var context = session.newContext();
            var page = context.newPage();
            page.navigate("https://example.com");
            System.out.println(page.title());
        }
    }
}`,
            note: "Connects to Mimic already listening at http://127.0.0.1:9222. Closing this session preserves the external runtime.",
            filename: "src/main/java/Main.java",
            lang: "java",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.14.1</version>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>Main</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
          {
            id: "version",
            label: "Pin a version",
            code: `import io.mimicbrowser.sdk.RuntimeOptions;
import io.mimicbrowser.sdk.playwright.PlaywrightSession;

public class Main {
    public static void main(String[] args) {
        try (var session = PlaywrightSession.launch(new RuntimeOptions().version("${releaseVersion}"))) {
            var context = session.newContext();
            var page = context.newPage();
            page.navigate("https://example.com");
            System.out.println(page.title());
        }
    }
}`,
            note: "The exact runtime version is downloaded once, verified and reused from the OS cache.",
            filename: "src/main/java/Main.java",
            lang: "java",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.14.1</version>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>Main</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
          {
            id: "media",
            label: "Camera & microphone",
            code: `import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import io.mimicbrowser.sdk.Generated;
import io.mimicbrowser.sdk.RuntimeOptions;
import io.mimicbrowser.sdk.playwright.PlaywrightSession;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        try (var session = PlaywrightSession.launch(new RuntimeOptions())) {
            var context = session.newContext(null, null, null, setup -> {
                var query = new Generated.GetMediaSourcesParams();
                query.browserContextId = Generated.OptionalValue.of(setup.browserContextId());
                var sources = setup.mimic().commands().getMediaSources(query).sources;
                var camera = sources.stream().filter(s -> s.kind.equals("videoinput"))
                    .findFirst().orElseThrow(() -> new IllegalStateException("No camera source"));
                var microphone = sources.stream().filter(s -> s.kind.equals("audioinput"))
                    .findFirst().orElseThrow(() -> new IllegalStateException("No microphone source"));
                var video = device("camera", "videoinput", "Studio Camera", camera.sourceId);
                var mode = new Generated.CameraFormat();
                mode.width = 1280L;
                mode.height = 720L;
                mode.frameRate = 30.0;
                video.modes = Generated.OptionalValue.of(List.of(mode));
                video.defaultMode = Generated.OptionalValue.of(mode);
                var processing = new Generated.MediaProcessing();
                processing.resize = Generated.OptionalValue.of("crop-and-scale");
                video.processing = Generated.OptionalValue.of(processing);
                var audio = device("microphone", "audioinput", "Studio Microphone", microphone.sourceId);
                var media = new Generated.MediaConfiguration();
                media.devices = Generated.OptionalValue.of(List.of(video, audio));
                return media;
            });
            var permission = new JsonObject();
            permission.addProperty("browserContextId", session.forContext(context).id());
            permission.addProperty("origin", "https://example.com");
            var names = new JsonArray();
            names.add("videoCapture");
            names.add("audioCapture");
            permission.add("permissions", names);
            session.mimic().send("Browser.grantPermissions", permission);
            var page = context.newPage();
            page.navigate("https://example.com");
            System.out.println(page.evaluate("""
                async () => {
                  const devices = await navigator.mediaDevices.enumerateDevices();
                  const camera = devices.find(device => device.label === "Studio Camera");
                  const microphone = devices.find(device => device.label === "Studio Microphone");
                  if (!camera || !microphone) throw new Error("Configured media is unavailable");
                  const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: camera.deviceId } },
                    audio: { deviceId: { exact: microphone.deviceId } }
                  });
                  try {
                    return JSON.stringify(stream.getTracks().map(track => ({
                      kind: track.kind, label: track.label, state: track.readyState
                    })));
                  } finally {
                    stream.getTracks().forEach(track => track.stop());
                  }
                }
                """));
        }
    }

    private static Generated.MediaDeviceProfile device(
            String key, String kind, String label, String sourceId) {
        var result = new Generated.MediaDeviceProfile();
        result.key = key;
        result.kind = kind;
        result.label = label;
        var source = new JsonObject();
        source.addProperty("sourceId", sourceId);
        result.source = source;
        result.group = Generated.OptionalValue.of("desk");
        return result;
    }
}`,
            note: "Requires accessible camera and microphone sources. Source IDs stay private; capture stops every track.",
            filename: "src/main/java/Main.java",
            lang: "java",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.14.1</version>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>Main</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "kotlin",
    label: "Kotlin",
    clients: [
      {
        id: "playwright",
        label: "Playwright",
        install: `mkdir mimic-kotlin-demo
cd mimic-kotlin-demo
mkdir src
mkdir src/main
mkdir src/main/kotlin`,
        examples: [
          {
            id: "launch",
            label: "Launch",
            code: `import io.mimicbrowser.sdk.RuntimeOptions
import io.mimicbrowser.sdk.playwright.PlaywrightSession

fun main() {
    PlaywrightSession.launch(RuntimeOptions()).use { session ->
        val context = session.newContext()
        val page = context.newPage()
        page.navigate("https://example.com")
        println(page.title())
    }
}`,
            filename: "src/main/kotlin/Main.kt",
            lang: "kotlin",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-kotlin-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <kotlin.version>2.2.21</kotlin.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
    <dependency>
      <groupId>org.jetbrains.kotlin</groupId>
      <artifactId>kotlin-stdlib</artifactId>
      <version>\${kotlin.version}</version>
    </dependency>
  </dependencies>
  <build>
    <sourceDirectory>src/main/kotlin</sourceDirectory>
    <plugins>
      <plugin>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-maven-plugin</artifactId>
        <version>\${kotlin.version}</version>
        <configuration><jvmTarget>17</jvmTarget></configuration>
        <executions>
          <execution>
            <id>compile</id><phase>compile</phase>
            <goals><goal>compile</goal></goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>MainKt</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
          {
            id: "connect",
            label: "Connect",
            code: `import io.mimicbrowser.sdk.RuntimeOptions
import io.mimicbrowser.sdk.playwright.PlaywrightSession

fun main() {
    PlaywrightSession.connect("http://127.0.0.1:9222").use { session ->
        val context = session.newContext()
        val page = context.newPage()
        page.navigate("https://example.com")
        println(page.title())
    }
}`,
            note: "Connects to Mimic already listening at http://127.0.0.1:9222. Closing this session preserves the external runtime.",
            filename: "src/main/kotlin/Main.kt",
            lang: "kotlin",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-kotlin-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <kotlin.version>2.2.21</kotlin.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
    <dependency>
      <groupId>org.jetbrains.kotlin</groupId>
      <artifactId>kotlin-stdlib</artifactId>
      <version>\${kotlin.version}</version>
    </dependency>
  </dependencies>
  <build>
    <sourceDirectory>src/main/kotlin</sourceDirectory>
    <plugins>
      <plugin>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-maven-plugin</artifactId>
        <version>\${kotlin.version}</version>
        <configuration><jvmTarget>17</jvmTarget></configuration>
        <executions>
          <execution>
            <id>compile</id><phase>compile</phase>
            <goals><goal>compile</goal></goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>MainKt</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
          {
            id: "version",
            label: "Pin a version",
            code: `import io.mimicbrowser.sdk.RuntimeOptions
import io.mimicbrowser.sdk.playwright.PlaywrightSession

fun main() {
    PlaywrightSession.launch(RuntimeOptions().version("${releaseVersion}")).use { session ->
        val context = session.newContext()
        val page = context.newPage()
        page.navigate("https://example.com")
        println(page.title())
    }
}`,
            note: "The exact runtime version is downloaded once, verified and reused from the OS cache.",
            filename: "src/main/kotlin/Main.kt",
            lang: "kotlin",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-kotlin-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <kotlin.version>2.2.21</kotlin.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
    <dependency>
      <groupId>org.jetbrains.kotlin</groupId>
      <artifactId>kotlin-stdlib</artifactId>
      <version>\${kotlin.version}</version>
    </dependency>
  </dependencies>
  <build>
    <sourceDirectory>src/main/kotlin</sourceDirectory>
    <plugins>
      <plugin>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-maven-plugin</artifactId>
        <version>\${kotlin.version}</version>
        <configuration><jvmTarget>17</jvmTarget></configuration>
        <executions>
          <execution>
            <id>compile</id><phase>compile</phase>
            <goals><goal>compile</goal></goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>MainKt</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
          {
            id: "media",
            label: "Camera & microphone",
            code: `import com.google.gson.JsonArray
import com.google.gson.JsonObject
import io.mimicbrowser.sdk.Generated
import io.mimicbrowser.sdk.RuntimeOptions
import io.mimicbrowser.sdk.playwright.PlaywrightSession

fun main() {
    PlaywrightSession.launch(RuntimeOptions()).use { session ->
        val context = session.newContext(null, null, null) { setup ->
            val query = Generated.GetMediaSourcesParams().apply {
                browserContextId = Generated.OptionalValue.of(setup.browserContextId())
            }
            val sources = setup.mimic().commands().getMediaSources(query).sources
            val camera = sources.firstOrNull { it.kind == "videoinput" }
                ?: error("No camera source is available")
            val microphone = sources.firstOrNull { it.kind == "audioinput" }
                ?: error("No microphone source is available")
            val video = device("camera", "videoinput", "Studio Camera", camera.sourceId)
            val mode = Generated.CameraFormat().apply {
                width = 1280
                height = 720
                frameRate = 30.0
            }
            video.modes = Generated.OptionalValue.of(listOf(mode))
            video.defaultMode = Generated.OptionalValue.of(mode)
            video.processing = Generated.OptionalValue.of(Generated.MediaProcessing().apply {
                resize = Generated.OptionalValue.of("crop-and-scale")
            })
            val audio = device("microphone", "audioinput", "Studio Microphone", microphone.sourceId)
            Generated.MediaConfiguration().apply {
                devices = Generated.OptionalValue.of(listOf(video, audio))
            }
        }
        val permission = JsonObject().apply {
            addProperty("browserContextId", session.forContext(context).id())
            addProperty("origin", "https://example.com")
            add("permissions", JsonArray().apply {
                add("videoCapture")
                add("audioCapture")
            })
        }
        session.mimic().send("Browser.grantPermissions", permission)
        val page = context.newPage()
        page.navigate("https://example.com")
        println(page.evaluate("""
            async () => {
              const devices = await navigator.mediaDevices.enumerateDevices();
              const camera = devices.find(device => device.label === "Studio Camera");
              const microphone = devices.find(device => device.label === "Studio Microphone");
              if (!camera || !microphone) throw new Error("Configured media is unavailable");
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: camera.deviceId } },
                audio: { deviceId: { exact: microphone.deviceId } }
              });
              try {
                return JSON.stringify(stream.getTracks().map(track => ({
                  kind: track.kind, label: track.label, state: track.readyState
                })));
              } finally {
                stream.getTracks().forEach(track => track.stop());
              }
            }
        """.trimIndent()))
    }
}

fun device(key: String, kind: String, label: String, sourceId: String) =
    Generated.MediaDeviceProfile().apply {
        this.key = key
        this.kind = kind
        this.label = label
        source = JsonObject().apply { addProperty("sourceId", sourceId) }
        group = Generated.OptionalValue.of("desk")
    }`,
            note: "Requires accessible camera and microphone sources. Source IDs stay private; capture stops every track.",
            filename: "src/main/kotlin/Main.kt",
            lang: "kotlin",
            run: "mvn -q compile exec:java",
            files: [
              {
                filename: "pom.xml",
                lang: "xml",
                code: `<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>example</groupId>
  <artifactId>mimic-kotlin-demo</artifactId>
  <version>1.0.0</version>
  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <kotlin.version>2.2.21</kotlin.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>${sdkMavenGroupId}</groupId>
      <artifactId>mimic-browser</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>com.microsoft.playwright</groupId>
      <artifactId>playwright</artifactId>
      <version>1.63.0</version>
    </dependency>
    <dependency>
      <groupId>org.jetbrains.kotlin</groupId>
      <artifactId>kotlin-stdlib</artifactId>
      <version>\${kotlin.version}</version>
    </dependency>
  </dependencies>
  <build>
    <sourceDirectory>src/main/kotlin</sourceDirectory>
    <plugins>
      <plugin>
        <groupId>org.jetbrains.kotlin</groupId>
        <artifactId>kotlin-maven-plugin</artifactId>
        <version>\${kotlin.version}</version>
        <configuration><jvmTarget>17</jvmTarget></configuration>
        <executions>
          <execution>
            <id>compile</id><phase>compile</phase>
            <goals><goal>compile</goal></goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <groupId>org.codehaus.mojo</groupId>
        <artifactId>exec-maven-plugin</artifactId>
        <version>3.6.1</version>
        <configuration><mainClass>MainKt</mainClass></configuration>
      </plugin>
    </plugins>
  </build>
</project>`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "php",
    label: "PHP",
    clients: [
      {
        id: "chrome-php",
        label: "chrome-php",
        install: `mkdir mimic-php-demo
cd mimic-php-demo
composer init --name=mimic/demo --no-interaction
composer require mimic-browser/sdk:${sdkVersion}`,
        dependencyInstall: "composer require chrome-php/chrome:1.16.0",
        examples: [
          {
            id: "launch",
            label: "Launch",
            code: `<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';

use Mimic\\Sdk\\Chrome\\ChromeSession;
use Mimic\\Sdk\\RuntimeOptions;

$session = ChromeSession::launch();
try {
    $context = $session->newContext();
    $page = $session->newPage($context);
    $page->navigate('https://example.com')->waitForNavigation();
    echo $page->evaluate('document.title')->getReturnValue(), PHP_EOL;
} finally {
    $session->close();
}`,
            filename: "example.php",
            lang: "php",
            run: "php example.php",
          },
          {
            id: "connect",
            label: "Connect",
            code: `<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';

use Mimic\\Sdk\\Chrome\\ChromeSession;
use Mimic\\Sdk\\RuntimeOptions;

$session = ChromeSession::connect('http://127.0.0.1:9222');
try {
    $context = $session->newContext();
    $page = $session->newPage($context);
    $page->navigate('https://example.com')->waitForNavigation();
    echo $page->evaluate('document.title')->getReturnValue(), PHP_EOL;
} finally {
    $session->close();
}`,
            note: "Connects to Mimic already listening at http://127.0.0.1:9222. Closing this session preserves the external runtime.",
            filename: "example.php",
            lang: "php",
            run: "php example.php",
          },
          {
            id: "version",
            label: "Pin a version",
            code: `<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';

use Mimic\\Sdk\\Chrome\\ChromeSession;
use Mimic\\Sdk\\RuntimeOptions;

$session = ChromeSession::launch(new RuntimeOptions(version: '${releaseVersion}'));
try {
    $context = $session->newContext();
    $page = $session->newPage($context);
    $page->navigate('https://example.com')->waitForNavigation();
    echo $page->evaluate('document.title')->getReturnValue(), PHP_EOL;
} finally {
    $session->close();
}`,
            note: "The exact runtime version is downloaded once, verified and reused from the OS cache.",
            filename: "example.php",
            lang: "php",
            run: "php example.php",
          },
          {
            id: "media",
            label: "Camera & microphone",
            code: `<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';

use Mimic\\Sdk\\Chrome\\ChromeSession;
use Mimic\\Sdk\\ContextSetup;
use Mimic\\Sdk\\Generated\\GetMediaSourcesParams;
use Mimic\\Sdk\\Generated\\MediaConfiguration;

$session = ChromeSession::launch();
try {
    $context = $session->newContext(mediaFactory: function (ContextSetup $setup): MediaConfiguration {
        $query = new GetMediaSourcesParams();
        $query->browserContextId = $setup->browserContextId;
        $sources = $setup->mimic->commands->getMediaSources($query)->sources;
        $cameras = array_values(array_filter($sources, fn($s) => $s->kind === 'videoinput'));
        $microphones = array_values(array_filter($sources, fn($s) => $s->kind === 'audioinput'));
        if (!$cameras || !$microphones) {
            throw new RuntimeException('A camera and microphone source are required');
        }
        return MediaConfiguration::fromWire(['devices' => [
            [
                'key' => 'camera', 'kind' => 'videoinput',
                'source' => ['sourceId' => $cameras[0]->sourceId],
                'label' => 'Studio Camera', 'group' => 'desk',
                'modes' => [['width' => 1280, 'height' => 720, 'frameRate' => 30]],
                'defaultMode' => ['width' => 1280, 'height' => 720, 'frameRate' => 30],
                'processing' => ['resize' => 'crop-and-scale'],
            ],
            [
                'key' => 'microphone', 'kind' => 'audioinput',
                'source' => ['sourceId' => $microphones[0]->sourceId],
                'label' => 'Studio Microphone', 'group' => 'desk',
            ],
        ]]);
    });
    $session->mimic->send('Browser.grantPermissions', [
        'browserContextId' => $context->id,
        'origin' => 'https://example.com',
        'permissions' => ['videoCapture', 'audioCapture'],
    ]);
    $page = $session->newPage($context);
    $page->navigate('https://example.com')->waitForNavigation();
    echo $page->evaluate(<<<'JS'
(async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const camera = devices.find(device => device.label === "Studio Camera");
  const microphone = devices.find(device => device.label === "Studio Microphone");
  if (!camera || !microphone) throw new Error("Configured media is unavailable");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: camera.deviceId } },
    audio: { deviceId: { exact: microphone.deviceId } }
  });
  try {
    return JSON.stringify(stream.getTracks().map(track => ({
      kind: track.kind, label: track.label, state: track.readyState
    })));
  } finally {
    stream.getTracks().forEach(track => track.stop());
  }
})()
JS
    )->getReturnValue(), PHP_EOL;
} finally {
    $session->close();
}`,
            note: "Requires accessible camera and microphone sources. Source IDs stay private; capture stops every track.",
            filename: "example.php",
            lang: "php",
            run: "php example.php",
          },
        ],
      },
    ],
  },
];
