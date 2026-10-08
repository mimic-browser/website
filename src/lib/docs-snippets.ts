export const launchCode = `# Windows
.\\mimic.exe --browser-mode headless --listen 127.0.0.1:9222

# Linux
./mimic --browser-mode headless --listen 127.0.0.1:9222`;
export const playwrightInstall = `npm install playwright-core@1.63.0`;
export const playwrightCode = `import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
try {
  const context = browser.contexts()[0];
  const page = await context.newPage();
  await page.goto("https://books.toscrape.com/", { waitUntil: "load" });
  console.log(await page.locator("h1").textContent());
} finally {
  // This disconnects the client; it does not own the Mimic process.
  await browser.close();
}`;
export const puppeteerInstall = `npm install puppeteer-core@25.10.0`;
export const puppeteerCode = `import puppeteer from "puppeteer-core";

const browser = await puppeteer.connect({
  browserURL: "http://127.0.0.1:9222",
  defaultViewport: null
});
const page = await browser.newPage();
await page.goto("https://books.toscrape.com/", { waitUntil: "load" });
console.log(await page.$eval("h1", node => node.textContent));
await page.close();
await browser.disconnect();`;
