// Ping IndexNow (Bing/Yandex/Seznam/Naver) with the full site URL list.
// The key file (public/{key}.txt) must be deployed and reachable before pinging.
// Usage: node scripts/ping-indexnow.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const globalConfig = JSON.parse(
  readFileSync(join(rootDir, "src", "data", "global_config.json"), "utf8"),
);
const BASE_URL = String(globalConfig.website_url || "https://kiramyao.com").replace(/\/+$/, "");
const HOST = new URL(BASE_URL).host;

const KEY = readFileSync(join(rootDir, "public", "c3d7885f033d4f83be3e6213c1df46fb.txt"), "utf8").trim();

const STATIC_PAGES = [
  "/",
  "/about-kiramyao",
  "/action",
  "/cat-cave",
  "/documents",
  "/join",
  "/privacy",
  "/report",
  "/stories",
];

function articleSectionPath(type) {
  return type === "blog" ? "cat-cave" : type;
}

export function buildUrlList(articles) {
  const pages = STATIC_PAGES.map((path) => `${BASE_URL}${path}`);
  const articleUrls = articles.map(
    (article) =>
      `${BASE_URL}/${articleSectionPath(article.type)}/${encodeURIComponent(article.slug)}`,
  );
  return [...pages, ...articleUrls];
}

export async function pingIndexNow(urlList) {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: `${BASE_URL}/${KEY}.txt`,
    urlList,
  };
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`IndexNow rejected (${response.status}): ${await response.text()}`);
  }
  return { status: response.status, count: urlList.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { readFileSync: read } = await import("node:fs");
  const articles = JSON.parse(read(join(rootDir, "src", "data", "compiled_articles.json"), "utf8"));
  const urlList = buildUrlList(articles);
  const result = await pingIndexNow(urlList);
  console.log(`Pinged ${result.count} URLs (${HOST}) -> HTTP ${result.status}`);
}
