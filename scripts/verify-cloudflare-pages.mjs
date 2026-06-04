import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "out");

const requiredFiles = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_worker.js",
  "llms.txt",
  ".well-known/api-catalog",
  ".well-known/agent-card.json",
  ".well-known/service-doc.md",
  ".well-known/dns-aid.example.txt",
  "ai/index.md",
  "ai/blog/2026-trans-survival-survey.md",
];

async function mustExist(relativePath) {
  const filePath = path.join(outDir, relativePath);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      throw new Error(`${relativePath} is not a file`);
    }
  } catch (error) {
    throw new Error(`Missing Cloudflare Pages output file: ${relativePath}`, {
      cause: error,
    });
  }
}

async function mustContain(relativePath, fragments) {
  const content = await readFile(path.join(outDir, relativePath), "utf8");
  for (const fragment of fragments) {
    if (!content.includes(fragment)) {
      throw new Error(`${relativePath} does not include ${fragment}`);
    }
  }
}

async function main() {
  await stat(outDir);

  for (const file of requiredFiles) {
    await mustExist(file);
  }

  await mustContain("_headers", [
    'rel="api-catalog"',
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "Content-Type: text/markdown; charset=utf-8",
  ]);
  await mustContain("_worker.js", [
    "env.ASSETS.fetch",
    "text/markdown; charset=utf-8",
    "x-markdown-tokens",
  ]);
  await mustContain("robots.txt", [
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "Sitemap: https://kiraequal.org/sitemap.xml",
  ]);
  await mustContain(".well-known/api-catalog", [
    '"homepage": "https://kiraequal.org/"',
    '"accept": "text/markdown"',
  ]);

  console.log("Cloudflare Pages output looks ready.");
}

main().catch((error) => {
  console.error(error.message);
  if (error.cause) {
    console.error(error.cause.message);
  }
  process.exitCode = 1;
});
