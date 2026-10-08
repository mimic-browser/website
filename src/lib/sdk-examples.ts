import { scriptLanguages } from "./sdk-examples-script";
import { managedLanguages } from "./sdk-examples-managed";
import { nativeLanguages } from "./sdk-examples-native";
import { releaseVersion } from "./release";
import { sdkDistributions, sdkVersion } from "./sdk-release";

export interface SdkFile {
  filename: string;
  lang: string;
  code: string;
}

export interface SdkExample extends SdkFile {
  id: string;
  label: string;
  run: string;
  note?: string;
  available?: boolean;
  files?: SdkFile[];
  expectedOutput?: string;
}

export interface SdkClient {
  id: string;
  label: string;
  install: string;
  installTitle?: string;
  installAlternatives?: { label: string; lang: string; code: string }[];
  dependencyInstall?: string;
  sourceInstall?: string;
  installNote?: string;
  examples: SdkExample[];
}

export interface SdkLanguage {
  id: string;
  label: string;
  requirements?: string;
  clients: SdkClient[];
}

export const sdkExamples: SdkLanguage[] = [
  ...scriptLanguages,
  ...managedLanguages.filter((language) => language.id !== "php"),
  ...nativeLanguages,
  ...managedLanguages.filter((language) => language.id === "php"),
];

function versionHint(language: string, client: string): string {
  const version = releaseVersion;
  switch (language) {
    case "javascript":
    case "typescript":
      return `launch({ runtimeVersion: "${version}" })`;
    case "python":
      return `launch(runtime_version="${version}")`;
    case "csharp":
      return `${client === "playwright" ? "PlaywrightSession" : "PuppeteerSession"}.LaunchAsync(new RuntimeOptions { Version = "${version}" })`;
    case "java":
      return `PlaywrightSession.launch(new RuntimeOptions().version("${version}"))`;
    case "kotlin":
      return `PlaywrightSession.launch(RuntimeOptions().version("${version}"))`;
    case "go":
      return `sdk.Launch(ctx, mimic.RuntimeOptions{Version: "${version}"})`;
    case "rust":
      return `Session::launch(RuntimeOptions { version: Some("${version}".into()), ..Default::default() }).await?`;
    case "ruby":
      return `MimicSDK::Ferrum.launch(runtime_version: "${version}")`;
    case "php":
      return `ChromeSession::launch(new RuntimeOptions(version: '${version}'))`;
    default:
      throw new Error(`Missing runtime version hint for ${language}`);
  }
}

const sourceRequirements: Record<string, string> = {
  javascript: "Requires Node.js 22.19 or later, and npm.",
  typescript: "Requires Node.js 22.19 or later, and npm.",
  python:
    "Requires Python 3.10 or later with pip and venv. Keep the virtual environment active for the remaining commands.",
  csharp: "Requires the .NET 8 SDK or later.",
  java: "Requires JDK 17 or later, and Maven.",
  kotlin:
    "Requires JDK 17 or later, and Maven. Maven installs the Kotlin compiler.",
  go: "Requires Go 1.26 or later.",
  rust: "Requires Rust 1.89 or later, Cargo, and your platform's native linker and build tools.",
  ruby: "Requires Ruby 3.2 or later, RubyGems, and native extension build tools.",
  php: "Requires PHP 8.2 or later, Composer, and the curl, json, openssl, zlib, and zip extensions.",
};

function distribution(language: string, client: string) {
  switch (language) {
    case "javascript":
    case "typescript":
      return sdkDistributions.node;
    case "python":
      return sdkDistributions.python;
    case "csharp":
      return client === "playwright"
        ? sdkDistributions.dotnetPlaywright
        : sdkDistributions.dotnetPuppeteer;
    case "java":
    case "kotlin":
      return sdkDistributions.java;
    case "go":
      return sdkDistributions.go;
    case "rust":
      return sdkDistributions.rust;
    case "ruby":
      return sdkDistributions.ruby;
    case "php":
      return sdkDistributions.php;
    default:
      throw new Error(`Missing SDK distribution for ${language}/${client}`);
  }
}

function installation(language: string, client: SdkClient): SdkClient {
  const selected = distribution(language, client.id);
  if (selected.published) return client;
  const clone = `git clone --branch v${sdkVersion} --depth 1 https://github.com/mimic-browser/sdk.git mimic-sdk`;
  let install = client.install;
  let installAlternatives = client.installAlternatives;
  switch (language) {
    case "javascript":
    case "typescript":
      install = install.replace(
        "npm install mimic-browser",
        `npm install git+https://github.com/mimic-browser/sdk.git#v${sdkVersion}`,
      );
      break;
    case "python": {
      const pip = `python -m pip install "mimic-browser @ git+https://github.com/mimic-browser/sdk.git@v${sdkVersion}#subdirectory=python"`;
      install = install.replace("python -m pip install mimic-browser", pip);
      installAlternatives = installAlternatives?.map((alternative) => ({
        ...alternative,
        code: alternative.code.replace(
          "python -m pip install mimic-browser",
          pip,
        ),
      }));
      break;
    }
    case "csharp": {
      const project =
        client.id === "playwright"
          ? "Mimic.Playwright"
          : "Mimic.PuppeteerSharp";
      install = `${clone}\ndotnet new console -n MimicDemo --framework net8.0\ncd MimicDemo\ndotnet add reference ../mimic-sdk/dotnet/${project}/${project}.csproj`;
      break;
    }
    case "java":
    case "kotlin":
      install = install.replace(
        "\nmkdir src",
        `\n${clone}\nmvn -B -ntp -f mimic-sdk/java/pom.xml -Dmaven.test.skip=true install\nmkdir src`,
      );
      break;
    case "rust":
      install = install.replace(
        `cargo add mimic-browser@${sdkVersion} --features chromiumoxide`,
        `cargo add mimic-browser --git https://github.com/mimic-browser/sdk.git --tag v${sdkVersion} --features chromiumoxide`,
      );
      break;
    case "ruby":
      install = `${clone}\ncd mimic-sdk/ruby\ngem build mimic-browser.gemspec\ngem install ./mimic-browser-${sdkVersion}.gem --no-document\ncd ../..`;
      break;
    case "php":
      install = install.replace(
        `composer require mimic-browser/sdk:${sdkVersion}`,
        `${clone}\ncomposer config repositories.mimic '{"type":"path","url":"./mimic-sdk/php","options":{"versions":{"mimic-browser/sdk":"${sdkVersion}"}}}'\ncomposer require mimic-browser/sdk:${sdkVersion}`,
      );
      break;
    default:
      throw new Error(`Missing Git installation for ${language}/${client.id}`);
  }
  return {
    ...client,
    install,
    installAlternatives,
    installNote: `The ${selected.registry} package is not published yet. These commands install the released GitHub source.`,
  };
}

export const sdkQuickstarts: SdkLanguage[] = sdkExamples.map((language) => ({
  ...language,
  requirements: `${sourceRequirements[language.id]}${language.clients.some((client) => !distribution(language.id, client.id).published) ? " Git is required for source installation." : ""}`,
  clients: language.clients.map((client) => ({
    ...installation(language.id, client),
    examples: client.examples
      .filter((example) => ["launch", "connect"].includes(example.id))
      .map((example) => {
        if (example.id !== "launch")
          return { ...example, expectedOutput: "Example Domain" };
        const lines = example.code.split("\n");
        const index = lines.findIndex((line) =>
          /\b(?:launch\s*\(|LaunchAsync\s*\(|Launch\s*\(|launch\s+do)/.test(
            line,
          ),
        );
        if (index < 0)
          throw new Error(
            `Missing launch call for ${language.id}/${client.id}`,
          );
        const indentation = lines[index].match(/^\s*/)?.[0] ?? "";
        const comment = ["python", "ruby"].includes(language.id) ? "#" : "//";
        lines.splice(
          index,
          0,
          `${indentation}${comment} Optional runtime pin: ${versionHint(language.id, client.id)}`,
        );
        return {
          ...example,
          code: lines.join("\n"),
          expectedOutput: "Example Domain",
        };
      }),
  })),
}));

export const mediaExamples: SdkLanguage[] = sdkExamples.map((language) => ({
  ...language,
  clients: language.clients.map((client) => ({
    ...client,
    examples: client.examples.filter((example) => example.id === "media"),
  })),
}));
