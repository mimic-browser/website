import { chromium } from "playwright-core";

const endpoint = process.env.MIMIC_CDP_URL ?? "http://127.0.0.1:9222";
const browser = await chromium.connectOverCDP(endpoint);
let page;
try {
  page = await browser.contexts()[0].newPage();
  const response = await page.goto("https://books.toscrape.com/", {
    waitUntil: "load",
    timeout: 30000,
  });
  if (!response || !response.ok()) {
    throw new Error(
      `Navigation failed: ${response?.status() ?? "no response"}`,
    );
  }
  const heading = await page.locator("h1").textContent();
  const books = await page
    .locator(".product_pod h3 a")
    .evaluateAll((nodes) =>
      nodes.map((a) => ({ title: a.title, url: a.href })),
    );
  if (heading?.trim() !== "All products" || books.length !== 20) {
    throw new Error(
      "Unexpected Books to Scrape content; inspect the response and DOM.",
    );
  }
  console.log(JSON.stringify({ heading: heading.trim(), books }, null, 2));
} finally {
  try {
    await page?.close();
  } finally {
    // Disconnect the client; the separately started Mimic process stays running.
    await browser.close();
  }
}
