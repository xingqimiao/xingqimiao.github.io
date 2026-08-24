// Build English (EN) variants of the survey report figures.
// Reads the final rendered figure HTML from the survey project (the exact
// files that produced the live ZH PNGs), swaps the Chinese text with the
// translation dictionary, and re-renders at the same 1440px canvas with the
// same fonts so EN figures match the originals pixel-for-pixel in size.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const equalNextRoot = process.env.EQUAL_NEXT_DIR || "E:/dev-kiraequalcom/equal-next";
const root = equalNextRoot;
const surveyRoot = process.env.SURVEY_PROJECT || "E:/dev-kiraequalcom/survey_report_project";
const srcDir = path.join(surveyRoot, "04_visualization", "03_all_figures", "_src");
const outSrcDir = path.join(root, ".runtime", "en_figure_src");
const outImgDir = path.join(root, "public", "pic", "report", "2026-transgender-life-survey-reader-edition");
const dictPath = path.join(root, "translations", "en", "report", "_fig_dict.json");

const dict = JSON.parse(await readFile(dictPath, "utf8"));
const keysSorted = Object.keys(dict).sort((a, b) => b.length - a.length);

function translate(html) {
  let out = html.replace('lang="zh-CN"', 'lang="en"');
  for (const key of keysSorted) {
    out = out.split(key).join(dict[key]);
  }
  return out;
}

const browserCandidates = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
];
let browserExe = null;
for (const c of browserCandidates) {
  try { await import("node:fs/promises").then((fs) => fs.access(c)); browserExe = c; break; } catch { /* next */ }
}
if (!browserExe) throw new Error("No local Edge/Chrome found");

const FIGURES = Array.from({ length: 26 }, (_, i) => `FIG${String(i + 1).padStart(3, "0")}`);
await mkdir(outSrcDir, { recursive: true });
await mkdir(outImgDir, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: browserExe });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const results = [];
for (const fig of FIGURES) {
  const raw = await readFile(path.join(srcDir, `${fig}.html`), "utf8");
  const translated = translate(raw);
  const enPath = path.join(outSrcDir, `${fig}.en.html`);
  await writeFile(enPath, translated, "utf8");
  await page.goto(pathToFileURL(enPath).href, { waitUntil: "load" });
  const canvas = page.locator(".canvas");
  await canvas.screenshot({ path: path.join(outImgDir, `${fig}.en.png`), type: "png" });
  const size = await canvas.boundingBox();
  results.push(`${fig}: ${Math.round(size.width)}x${Math.round(size.height)}`);
}
await browser.close();
console.log(results.join("\n"));
