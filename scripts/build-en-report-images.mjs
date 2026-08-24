// Lossless-fill English versions of the remaining report images.
// Overview: for each labelled region, detect the Chinese text's exact pixel
// bounds in the original (bright/coloured pixel scan within a row band),
// cover that area with the sampled background colour, and draw the English
// text auto-fitted to the same space. Output at original pixel dimensions.
import sharp from "sharp";
import { chromium } from "playwright";
import { readFile as fsRead, writeFile, access, rm } from "node:fs/promises";
import path from "node:path";

const publicDir = "E:/dev-kiraequalcom/equal-next/public/pic/report";

const browserCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

async function dataUrl(file) {
  const buf = await fsRead(file);
  const ext = path.extname(file).slice(1).replace("jpg", "jpeg");
  return `data:image/${ext};base64,${buf.toString("base64")}`;
}

// raw pixel scan helpers
async function rawOf(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, info };
}

async function colorOf(file, x, y) {
  const { data, info } = await rawOf(file);
  const px = (y * info.width + x) * info.channels;
  return [data[px], data[px + 1], data[px + 2]];
}

// Detect pixel bounds in a band where predicate(r,g,b) is true.
// Returns null if no pixels found, else {x0,y0,x1,y1}.
async function inkSpan(file, band, predicate) {
  const { data, info } = await rawOf(file);
  const { x0: bx0, x1: bx1, y0: by0, y1: by1 } = band;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let y = Math.max(0, by0); y <= Math.min(info.height - 1, by1); y++) {
    for (let x = Math.max(0, bx0); x <= Math.min(info.width - 1, bx1); x++) {
      const px = (y * info.width + x) * info.channels;
      if (predicate(data[px], data[px + 1], data[px + 2])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x0: minX, y0: minY, x1: maxX, y1: maxY };
}

const isRed = (r, g, b) => r > 150 && g < 90 && b < 90;
const isBright = (r, g, b) => r > 140 && g > 140 && b > 140;
const isDark = (r, g, b) => r < 90 && g < 90 && b < 90;
const isLib = (r, g, b) => r < 120 && g < 120 && b < 120; // near-black text
const isWhite = (r, g, b) => r > 140 && g > 140 && b > 140;

function pageHtml(img, W, H, overlays) {
  const items = overlays.map((o) => [
    o.fill ? `<div style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;background:${o.fill};"></div>` : "",
    o.text ? `<div style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.w}px;text-align:${o.align || "left"};font-family:${o.font || "'Microsoft YaHei',sans-serif"};font-size:${o.size}px;font-weight:${o.weight || 400};color:${o.color || "#1a1a1a"};line-height:${o.lh || 1.2};white-space:nowrap;">${o.text}</div>` : "",
  ].join("")).join("");
  return `<html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{width:${W}px;height:${H}px;overflow:hidden;}</style></head><body><img src="${img}" width="${W}" height="${H}" style="display:block;">${items}</body></html>`;
}

async function pageFromFile(file, W, H, overlays) {
  return pageHtml(await dataUrl(file), W, H, overlays);
}

// Given an ink span and the English string, compute font size that fits the
// span width (rough width = chars * 0.53 * fs), capped.
function fitSize(text, span, cap = 200, min = 14) {
  const w = span.x1 - span.x0;
  const fs = w / (text.length * 0.53);
  return Math.max(min, Math.min(cap, Math.floor(fs)));
}

async function render(dest, W, H, html, type = "png") {
  let browserExe = null;
  for (const c of browserCandidates) {
    try { await access(c); browserExe = c; break; } catch { /* next */ }
  }
  if (!browserExe) throw new Error("No local Edge/Chrome");
  const browser = await chromium.launch({ headless: true, executablePath: browserExe });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.waitForLoadState("load");
  const tmp = dest + ".tmp.png";
  await page.screenshot({ path: tmp, type: "png" });
  await browser.close();
  if (type === "jpeg") {
    await sharp(tmp).jpeg({ quality: 95 }).toFile(dest);
    await rm(tmp);
  } else {
    await rm(dest).catch(() => null);
    await writeFile(dest, await sharp(tmp).png().toBuffer());
    await rm(tmp);
  }
  console.log("wrote", dest);
}

// Auto-fill one label: detect span in band, cover with sampled bg, fit EN text.
async function label(item, file, band, predicate, color) {
  const span = await inkSpan(file, band, predicate);
  if (!span) { console.warn("no ink in band", band); return null; }
  const fill = item.background;
  const size = fitSize(item.text, span, item.maxSize || 64);
  const pad = Math.round((span.y1 - span.y0) * 0.18) + 4;
  const align = item.align || "left";
  const x = align === "center" ? span.x0 : align === "right" ? span.x0 : span.x0;
  const w = span.x1 - span.x0 + 60;
  return [
    { x: span.x0 - 10, y: span.y0 - pad, w: span.x1 - span.x0 + 20, h: span.y1 - span.y0 + pad * 2, fill },
    {
      x: align === "center" ? span.x0 - 30 : span.x0,
      y: span.y0 - Math.round(size * 0.18),
      w: w + 60,
      size,
      weight: item.weight || 400,
      color: item.color || "#222",
      align,
      text: item.text,
    },
  ];
}


// Find row bands (y clusters) containing at least minPixels matching pixels.
async function rowBands(file, x0, x1, y0, y1, predicate, minPixels = 8) {
  const { data, info } = await rawOf(file);
  const counts = [];
  for (let y = Math.max(0, y0); y <= Math.min(info.height - 1, y1); y++) {
    let n = 0;
    for (let x = Math.max(0, x0); x <= Math.min(info.width - 1, x1); x++) {
      const px = (y * info.width + x) * info.channels;
      if (predicate(data[px], data[px + 1], data[px + 2])) n++;
    }
    counts.push([y, n]);
  }
  const bands = [];
  let cur = null;
  for (const [y, n] of counts) {
    if (n >= minPixels) {
      if (!cur) cur = [y, y];
      else cur[1] = y;
    } else if (cur) {
      if (cur[1] - cur[0] > 8) bands.push(cur);
      cur = null;
    }
  }
  if (cur && cur[1] - cur[0] > 8) bands.push(cur);
  return bands;
}

async function main() {
  // ---------- status-report-02: white bar chart (1672x941) ----------
  const s02 = `${publicDir}/kiraequal-china-transgender-status-report-02.png`;
  const isInk = (r, g, b) => r < 120 && g < 120 && b < 140;
  const overlays02 = [];
  const titleSpan = await inkSpan(s02, { x0: 300, x1: 1400, y0: 30, y1: 110 }, isInk);
  const titleSize = fitSize("80.5% of respondents are currently on HRT", titleSpan, Math.min(64, Math.round((titleSpan.y1 - titleSpan.y0) * 1.15)));
  overlays02.push({ x: titleSpan.x0 - 20, y: titleSpan.y0 - 12, w: titleSpan.x1 - titleSpan.x0 + 40, h: titleSpan.y1 - titleSpan.y0 + 24, fill: "#ffffff" });
  overlays02.push({ x: titleSpan.x0, y: titleSpan.y0 - Math.round(titleSize * 0.2), w: titleSpan.x1 - titleSpan.x0, size: titleSize, weight: 700, color: "#2f2f2f", align: "center", text: "80.5% of respondents are currently on HRT" });

  const zh02 = [
    { band: { x0: 680, x1: 800, y0: 370, y1: 430 }, text: "of whom", color: "#37618e", predicate: (r, g, b) => b > 110 && b > r + 30 },
    { band: { x0: 900, x1: 1200, y0: 195, y1: 260 }, text: "Among HRT respondents:", color: "#2b2b2b", predicate: isInk },
    { band: { x0: 130, x1: 640, y0: 800, y1: 870 }, text: "Respondents currently on HRT", color: "#2b2b2b", predicate: isInk },
    { band: { x0: 900, x1: 1170, y0: 800, y1: 870 }, text: "Self-obtained", color: "#2b2b2b", predicate: isInk },
    { band: { x0: 1260, x1: 1640, y0: 800, y1: 870 }, text: "Via a regular hospital", color: "#2b2b2b", predicate: isInk },
  ];
  for (const it of zh02) {
    const ov = await label({ text: it.text, background: "#fff", color: it.color, align: it.text === "of whom" ? "center" : "center" }, s02, it.band, it.predicate, it.color);
    if (ov) overlays02.push(...ov);
  }
  await render(`${publicDir}/kiraequal-china-transgender-status-report-02.en.png`, 1672, 941,
    await pageFromFile(s02, 1672, 941, overlays02), "png");

  // ---------- status-report-04: dark bar chart (1672x941) ----------
  const s04 = `${publicDir}/kiraequal-china-transgender-status-report-04.png`;
  const overlays04 = [];
  const zh04 = [
    { band: { x0: 100, x1: 460, y0: 120, y1: 200 }, text: "Concern / questioning", color: "#e23f33", weight: 700 },
    { band: { x0: 100, x1: 460, y0: 250, y1: 340 }, text: "Doubt / blame", color: "#e23f33", weight: 700 },
    { band: { x0: 100, x1: 900, y0: 450, y1: 515 }, text: "The harm transgender people face includes, but is not limited to:", color: "#e6e6e6", weight: 400 },
    { band: { x0: 100, x1: 460, y0: 545, y1: 615 }, text: "Restricting freedom", color: "#e23f33", weight: 700 },
    { band: { x0: 100, x1: 460, y0: 630, y1: 710 }, text: "Physical or verbal violence", color: "#e23f33", weight: 700 },
    { band: { x0: 100, x1: 460, y0: 728, y1: 805 }, text: "Sent to informal \u201cconversion\u201d institutions", color: "#e23f33", weight: 700 },
  ];
  for (const it of zh04) {
    const ov = await label({ text: it.text, background: "#000000", color: it.color, weight: it.weight }, s04, it.band, isRed, it.color);
    if (ov) overlays04.push(...ov);
  }
  await render(`${publicDir}/kiraequal-china-transgender-status-report-04.en.png`, 1672, 941,
    await pageFromFile(s04, 1672, 941, overlays04), "png");

  // ---------- status-report-06: dark chart (2752x1536) ----------
  const s06 = `${publicDir}/kiraequal-china-transgender-status-report-06.jpeg`;
  const flat06 = await colorOf(s06, 2650, 1450);
  const bg = `rgba(${flat06[0]},${flat06[1]},${flat06[2]},1)`;
  const overlays06 = [];
  const titleSpan6 = await inkSpan(s06, { x0: 100, x1: 2650, y0: 380, y1: 660 }, isRed);
  if (titleSpan6) {
    const tSize = fitSize("Sense of safety and comfort in public activities", titleSpan6, Math.min(92, Math.round((titleSpan6.y1 - titleSpan6.y0) * 0.8)));
    overlays06.push({ x: titleSpan6.x0 - 20, y: titleSpan6.y0 - 12, w: titleSpan6.x1 - titleSpan6.x0 + 40, h: titleSpan6.y1 - titleSpan6.y0 + 24, fill: bg });
    const textW = Math.round("Sense of safety and comfort in public activities".length * 0.53 * tSize);
    const cx = Math.round((titleSpan6.x0 + titleSpan6.x1) / 2);
    overlays06.push({ x: cx - Math.round(textW / 2), y: titleSpan6.y0 - Math.round(tSize * 0.2), w: textW + 20, size: tSize, weight: 800, color: "#c33223", align: "center", text: "Sense of safety and comfort in public activities" });
  }
  const labelBands6 = await rowBands(s06, 350, 690, 650, 1350, isWhite, 6);
  const zh06 = ["Very uncomfortable", "Somewhat uncomfortable", "Average", "Fairly comfortable", "Very comfortable"];
  for (let i = 0; i < Math.min(labelBands6.length, zh06.length); i++) {
    const [y0, y1] = labelBands6[i];
    const span = await inkSpan(s06, { x0: 350, x1: 690, y0, y1 }, isWhite);
    if (!span) continue;
    const size = fitSize(zh06[i], span, 56);
    const textW = Math.round(zh06[i].length * 0.53 * size);
    overlays06.push({ x: 270, y: y0 - 8, w: 430, h: y1 - y0 + 18, fill: bg });
    overlays06.push({ x: Math.max(20, span.x1 - textW), y: y0 - Math.round(size * 0.18), w: textW + 10, size, weight: 500, color: "#f2f2f2", align: "right", text: zh06[i] });
  }
  await render(`${publicDir}/kiraequal-china-transgender-status-report-06.en.jpeg`, 2752, 1536,
    await pageFromFile(s06, 2752, 1536, overlays06), "jpeg");

  // ---------- status-report-01: watercolor pie legend (2752x1536) ----------
  const s01 = `${publicDir}/kiraequal-china-transgender-status-report-01.jpeg`;
  const legendTexts = ["Depressive disorder", "Anxiety disorder", "Post-traumatic stress disorder", "Bipolar disorder", "Eating disorder", "ADHD", "Dissociative identity disorder", "Schizophrenia", "Autism spectrum disorder", "Undiagnosed or no self-reported clear issue"];
  const overlays01 = [];
  const legendRows01 = await rowBands(s01, 1700, 2430, 100, 1400, isLib, 6);
  for (let i = 0; i < Math.min(legendRows01.length, legendTexts.length); i++) {
    const [y0, y1] = legendRows01[i];
    const span = await inkSpan(s01, { x0: 1700, x1: 2430, y0, y1 }, isLib);
    if (!span) continue;
    const bgc = await colorOf(s01, Math.min(2650, span.x1 + 60), Math.round((y0 + y1) / 2));
    const fill = `rgba(${bgc[0]},${bgc[1]},${bgc[2]},1)`;
    const size = fitSize(legendTexts[i], span, 42, 16);
    overlays01.push({ x: span.x0 - 12, y: y0 - 10, w: span.x1 - span.x0 + 24, h: y1 - y0 + 20, fill });
    overlays01.push({ x: span.x0 - Math.round(size * 0.05), y: y0 - Math.round(size * 0.2), w: span.x1 - span.x0 + 24, size, weight: 400, color: "#1c1c1c", text: legendTexts[i] });
  }
  await render(`${publicDir}/kiraequal-china-transgender-status-report-01.en.jpeg`, 2752, 1536,
    await pageFromFile(s01, 2752, 1536, overlays01), "jpeg");
}

main().catch((e) => { console.error(e); process.exit(1); });
