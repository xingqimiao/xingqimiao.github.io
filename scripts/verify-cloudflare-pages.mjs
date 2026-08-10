import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "out");

const REQUIRED_FILES = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_worker.js",
  "llms.txt",
  ".well-known/api-catalog",
  ".well-known/api-catalog.json",
  ".well-known/agent-card.json",
  ".well-known/service-doc.md",
  ".well-known/dns-aid.example.txt",
  "ai/index.md",
  "ai/stories.md",
  "ai/search-index.json",
];

const REMOVED_PUBLIC_ROUTES = [
  "en/index.html",
  "about/index.html",
];

const STORY_SLUG_ALIASES = Object.freeze({
  "88737526": "45648863",
  "cat-birthday-17-kira": "45648863",
});

async function outputPath(outputDir, relativePath) {
  const candidates = [relativePath];
  if (relativePath.endsWith('/index.html')) {
    candidates.push(`${relativePath.slice(0, -'/index.html'.length)}.html`);
  }
  for (const candidate of candidates) {
    try {
      const info = await stat(path.join(outputDir, candidate));
      if (info.isFile()) return path.join(outputDir, candidate);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Missing Cloudflare Pages output file: ${relativePath}`);
}

async function mustExist(outputDir, relativePath) {
  try {
    await outputPath(outputDir, relativePath);
  } catch (error) {
    throw new Error(`Missing Cloudflare Pages output file: ${relativePath}`, {
      cause: error,
    });
  }
}

async function mustNotExist(outputDir, relativePath) {
  try {
    await outputPath(outputDir, relativePath);
  } catch (error) {
    if (error.message === `Missing Cloudflare Pages output file: ${relativePath}`) {
      return;
    }
    throw error;
  }
  throw new Error(`Deprecated public route generated: ${relativePath}`);
}

async function mustContain(outputDir, relativePath, fragments) {
  const content = await readFile(path.join(outputDir, relativePath), "utf8");
  for (const fragment of fragments) {
    if (!content.includes(fragment)) {
      throw new Error(`${relativePath} does not include ${fragment}`);
    }
  }
}

async function readJson(outputDir, relativePath) {
  return JSON.parse(await readFile(path.join(outputDir, relativePath), "utf8"));
}

function storyResources(catalog) {
  return catalog.resources.filter((resource) => resource.kind === "stories");
}

function verifyStoryCatalogResources(catalog, label) {
  for (const resource of storyResources(catalog)) {
    for (const field of ["description", "desc", "englishDescription", "summary"]) {
      if (Object.hasOwn(resource, field)) {
        throw new Error(`Story summary field ${field} leaked into ${label}`);
      }
    }
  }
}

async function verifyStoryMarkdownDirectory(outputDir, catalog, locale) {
  const relativeDirectory = locale === "en" ? "ai/en/stories" : "ai/stories";
  const directory = path.join(outputDir, relativeDirectory);
  const expected = new Set(storyResources(catalog).map((resource) => path.posix.basename(resource.markdown)));
  const entries = await readdir(directory, { withFileTypes: true });
  const actual = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);

  for (const fileName of actual) {
    if (!expected.has(fileName)) {
      throw new Error(`Unexpected stale Story Markdown: ${relativeDirectory}/${fileName}`);
    }
    const markdown = await readFile(path.join(directory, fileName), "utf8");
    if (/^(?:description|description_zh|desc|englishDescription|summary):/mu.test(markdown)) {
      throw new Error(`Story summary field leaked into ${relativeDirectory}/${fileName}`);
    }
  }
  for (const fileName of expected) {
    if (!actual.includes(fileName)) {
      throw new Error(`Missing Story Markdown: ${relativeDirectory}/${fileName}`);
    }
  }
}

async function importWorker(outputDir) {
  const source = await readFile(path.join(outputDir, "_worker.js"), "utf8");
  const encoded = Buffer.from(source, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}`);
}

async function verifyWorkerNegotiation(outputDir) {
  const workerModule = await importWorker(outputDir);
  if (JSON.stringify(workerModule.STORY_SLUG_ALIASES) !== JSON.stringify(STORY_SLUG_ALIASES)) {
    throw new Error("_worker.js does not export the current STORY_SLUG_ALIASES");
  }

  const requestedPaths = [];
  const env = {
    ASSETS: {
      async fetch(request) {
        requestedPaths.push(new URL(request.url).pathname);
        return new Response("# Markdown");
      },
    },
  };
  for (const [htmlPath, markdownPath] of [
    ["/stories/current-story", "/ai/stories/current-story.md"],
  ]) {
    const response = await workerModule.default.fetch(new Request(`https://kiraequal.org${htmlPath}`, {
      headers: { Accept: "text/markdown" },
    }), env);
    if (response.status !== 200 || requestedPaths.at(-1) !== markdownPath) {
      throw new Error(`Markdown negotiation failed for ${htmlPath}`);
    }
  }

  for (const [oldSlug, newSlug] of Object.entries(STORY_SLUG_ALIASES)) {
    const response = await workerModule.default.fetch(
      new Request(`https://kiraequal.org/stories/${oldSlug}?source=bookmark`),
      env,
    );
    const expected = `https://kiraequal.org/stories/${newSlug}?source=bookmark`;
    if (response.status !== 308 || response.headers.get("location") !== expected) {
      throw new Error(`Story alias redirect failed for /stories/${oldSlug}`);
    }
  }

  const removedEnglishRoute = await workerModule.default.fetch(
    new Request("https://kiraequal.org/en/stories/current-story", {
      headers: { Accept: "text/markdown" },
    }),
    env,
  );
  if (
    removedEnglishRoute.headers.get("location")
    || requestedPaths.at(-1) !== "/en/stories/current-story"
  ) {
    throw new Error("Removed English route was intercepted by _worker.js");
  }
}

export async function verifyCloudflarePages(outputDir = outDir) {
  await stat(outputDir);
  for (const file of REQUIRED_FILES) {
    await mustExist(outputDir, file);
  }
  for (const route of REMOVED_PUBLIC_ROUTES) {
    await mustNotExist(outputDir, route);
  }

  await mustContain(outputDir, "_headers", [
    'rel="api-catalog"',
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "Content-Type: text/markdown; charset=utf-8",
  ]);
  await mustContain(outputDir, "robots.txt", [
    "Content-Signal: ai-train=no, search=yes, ai-input=yes",
    "Sitemap: https://kiraequal.org/sitemap.xml",
  ]);

  const zhCatalog = await readJson(outputDir, ".well-known/api-catalog.json");
  const zhSearch = await readJson(outputDir, "ai/search-index.json");
  if (zhCatalog.language !== "zh-CN" || zhSearch.language !== "zh-CN") {
    throw new Error("Agent catalog and search index must declare the zh-CN language");
  }

  verifyStoryCatalogResources(zhCatalog, "Chinese catalog");
  for (const resource of zhCatalog.resources) {
    await mustExist(outputDir, resource.markdown.replace(/^\//, ""));
  }
  await verifyStoryMarkdownDirectory(outputDir, zhCatalog, "zh");
  await verifyWorkerNegotiation(outputDir);

  return {
    zhLanguage: zhCatalog.language,
    zhResources: zhCatalog.resources.length,
  };
}

async function main() {
  const result = await verifyCloudflarePages(outDir);
  console.log(
    `Cloudflare Pages Chinese public output looks ready: ${result.zhResources} zh resources.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    if (error.cause) {
      console.error(error.cause.message);
    }
    process.exitCode = 1;
  });
}
