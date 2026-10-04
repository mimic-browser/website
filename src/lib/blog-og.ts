import sharp, { type OverlayOptions } from "sharp";
import { resolve } from "node:path";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const fontfile = resolve("assets/fonts/Inter.ttf");
const ink = "#f0f3f7";
const muted = "#b6bfdc";
const blue = "#93a6ff";
const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

async function textImage(text: string, size: number, color = ink, bold = false) {
  return sharp({ text: {
    text: `<span foreground="${color}" letter_spacing="${bold ? -1024 : 0}">${escape(text)}</span>`,
    font: `Inter ${bold ? "Bold" : "Regular"} ${size}`, fontfile, dpi: 72, rgba: true,
  } }).png().toBuffer({ resolveWithObject: true });
}

// Balance complete words using their actual rendered widths. Never clip or ellipsize a title.
export async function layoutTitle(title: string) {
  if (!title.trim() || title.length > 320) throw new Error(`Blog OG title does not fit without clipping: ${title}`);
  const words = title.trim().split(/\s+/);
  for (const size of [84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40]) {
    const widths = new Map<string, number>();
    const width = async (line: string) => {
      if (!widths.has(line)) widths.set(line, (await textImage(line, size, ink, true)).info.width);
      return widths.get(line)!;
    };
    const maxLines = Math.min(4, Math.floor(304 / (size * 1.14)));
    for (let count = 1; count <= maxLines; count++) {
      const target = (await width(words.join(" "))) / count;
      const cache = new Map<string, { lines: string[]; cost: number } | null>();
      async function solve(start: number, remaining: number): Promise<{ lines: string[]; cost: number } | null> {
        if (!remaining) return start === words.length ? { lines: [], cost: 0 } : null;
        const key = `${start}:${remaining}`;
        if (cache.has(key)) return cache.get(key)!;
        let best: { lines: string[]; cost: number } | null = null;
        for (let end = start + 1; end <= words.length - remaining + 1; end++) {
          const line = words.slice(start, end).join(" ");
          const measured = await width(line);
          if (measured > 1056) break;
          const rest = await solve(end, remaining - 1);
          if (!rest) continue;
          const dangling = /\b(a|an|the|for|of|to|and|without|with|in)$/i.test(line) ? 50000 : 0;
          const orphan = count > 1 && end - start === 1 ? 25000 : 0;
          const cost = rest.cost + (measured - target) ** 2 + dangling + orphan;
          if (!best || cost < best.cost) best = { lines: [line, ...rest.lines], cost };
        }
        cache.set(key, best);
        return best;
      }
      const result = await solve(0, count);
      if (result) return { size, lines: result.lines, lineHeight: Math.round(size * 1.14) };
    }
  }
  throw new Error(`Blog OG title does not fit without clipping: ${title}`);
}

export interface BlogOgData { title: string; author: string; published: Date; lang: "en" | "ru"; }

export async function createBlogOg(data: BlogOgData) {
  const title = await layoutTitle(data.title);
  const layers: OverlayOptions[] = [];
  const bounds: { text: string; x: number; y: number; width: number; height: number }[] = [];
  async function add(text: string, size: number, x: number, y: number, color = ink, bold = false, right = false) {
    const rendered = await textImage(text, size, color, bold);
    if (right) x -= rendered.info.width;
    if (x < 72 || x + rendered.info.width > 1128 || y < 48 || y + rendered.info.height > 582) {
      throw new Error(`Blog OG text exceeds safe area: ${text}`);
    }
    layers.push({ input: rendered.data, left: x, top: y });
    bounds.push({ text, x, y, width: rendered.info.width, height: rendered.info.height });
    return rendered.info.width;
  }
  const brandWidth = await add("mimic", 32, 72, 61, ink, true);
  await add(".boo", 32, 72 + brandWidth + 1, 61, blue, true);
  await add("Blog", 23, 1128, 69, muted, false, true);
  const height = (title.lines.length - 1) * title.lineHeight + title.size;
  const top = Math.round(174 + (304 - height) / 2);
  for (const [index, line] of title.lines.entries()) {
    const color = title.lines.length > 1 && index === title.lines.length - 1 ? blue : ink;
    await add(line, title.size, 72, top + index * title.lineHeight, color, true);
  }
  const date = new Intl.DateTimeFormat(data.lang, { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(data.published);
  const author = await add(data.author, 24, 72, 551, muted);
  const dateWidth = await add(date, 24, 1128, 551, muted, false, true);
  if (author + dateWidth + 48 > 1056) throw new Error("Blog OG author and date overlap");
  const background = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#090e16"/><path d="M72 127H1128M72 519H1128" stroke="#252c40"/><path d="M72 127H144" stroke="#718bff" stroke-width="3"/></svg>`);
  const png = await sharp(background).composite(layers).removeAlpha().png().toBuffer();
  return { png, title, bounds };
}
