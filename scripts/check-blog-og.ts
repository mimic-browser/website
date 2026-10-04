import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { createBlogOg } from "../src/lib/blog-og.ts";

const data = { author: "Vyacheslav Lavrov", published: new Date("2026-10-04"), lang: "en" as const };
const cases = [
  "Building a browser runtime for automation without Chromium",
  "A smaller runtime",
  "Understanding browser compatibility: JavaScript APIs, network behavior, isolated contexts and the details that matter in real automation workflows",
  "Как устроена совместимость браузерного runtime: JavaScript, сетевое поведение и наблюдаемые сайтами API",
  "Canvas, fonts & text: <measurements> and browser compatibility",
];
let first: Buffer | undefined;
for (const title of cases) {
  const output = await createBlogOg({ ...data, title });
  const metadata = await sharp(output.png).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, "png");
  assert.equal(metadata.hasAlpha, false);
  assert.equal(output.title.lines.join(" "), title);
  for (const box of output.bounds) {
    assert.ok(box.x >= 72 && box.x + box.width <= 1128);
    assert.ok(box.y >= 48 && box.y + box.height <= 582);
  }
  assert.ok(output.bounds.filter(box => output.title.lines.includes(box.text)).every(box => box.y + box.height < 519));
  if (!first) first = output.png;
  console.log(`OG: ${output.title.lines.length} lines at ${output.title.size}px; safe areas verified`);
}
const repeat = await createBlogOg({ ...data, title: cases[0] });
assert.equal(createHash("sha256").update(first!).digest("hex"), createHash("sha256").update(repeat.png).digest("hex"));
await assert.rejects(createBlogOg({ ...data, title: "Unbreakable".repeat(80) }), /does not fit/);
const luminance = (hex: string) => {
  const rgb = hex.match(/\w\w/g)!.map(x => parseInt(x, 16) / 255).map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
for (const color of ["f0f3f7", "93a6ff", "b6bfdc"]) assert.ok((luminance(color) + 0.05) / (luminance("090e16") + 0.05) > 7);
console.log("PASS: PNG dimensions, full titles, safe areas, metadata, contrast >7:1 and deterministic output");
