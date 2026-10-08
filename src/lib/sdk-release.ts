// The SDK is released independently from the Mimic runtime.
export const sdkVersion = "0.1.1";
export const minimumSdkRuntimeVersion = "0.2.4";

// Mark a registry available only after its public package can be installed.
export const sdkDistributions = {
  node: { registry: "npm", published: true },
  python: { registry: "PyPI", published: true },
  dotnetPlaywright: { registry: "NuGet", published: true },
  dotnetPuppeteer: { registry: "NuGet", published: true },
  java: { registry: "Maven Central", published: true },
  go: { registry: "Go modules", published: true },
  rust: { registry: "crates.io", published: true },
  ruby: { registry: "RubyGems", published: true },
  php: { registry: "Packagist", published: true },
} as const;

export const sdkMavenGroupId = "boo.mimic";
