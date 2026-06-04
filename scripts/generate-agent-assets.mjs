import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const wellKnownDir = path.join(publicDir, ".well-known");
const aiDir = path.join(publicDir, "ai");

const SITE_URL = "https://kiraequal.org";
const SITE_HOST = "kiraequal.org";
const SITE_TITLE = "KiraMyao Equal";
const SITE_DESCRIPTION =
  "KiraMyao Equal 关注中国跨性别与性别多元群体的生存处境、社群故事、资料整理和公共倡议，发布调查、报告、文章与参与方式。";
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";
const LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/json"',
  '</.well-known/service-doc.md>; rel="service-doc"; type="text/markdown"',
  '</llms.txt>; rel="alternate"; type="text/markdown"',
].join(", ");

async function readJson(relativePath) {
  const raw = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(raw);
}

async function readTextIfExists(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function canonical(route = "") {
  if (!route || route === "/") {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${route.startsWith("/") ? route : `/${route}`}`;
}

function pageTitle(title) {
  return `${title} | ${SITE_TITLE}`;
}

function frontmatter(fields) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const text = String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(`${key}: "${text.replace(/\r?\n/g, " ")}"`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, value) =>
      String.fromCodePoint(Number.parseInt(value, 10)),
    );
}

function stripTags(text) {
  return decodeEntities(text.replace(/<[^>]*>/g, "")).trim();
}

function htmlToMarkdown(html = "") {
  let text = html
    .replace(/\r/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<img\b([^>]*)>/gi, (_, attrs) => {
      const src = (attrs.match(/\bsrc=["']([^"']+)["']/i) || [])[1] || "";
      const alt = (attrs.match(/\balt=["']([^"']*)["']/i) || [])[1] || "";
      return src ? `\n\n![${stripTags(alt)}](${src})\n\n` : "";
    })
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, label) => {
      const href = (attrs.match(/\bhref=["']([^"']+)["']/i) || [])[1] || "";
      const cleanLabel = stripTags(label);
      return href ? `[${cleanLabel}](${href})` : cleanLabel;
    })
    .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
      return `\n\n${"#".repeat(Number(level))} ${stripTags(content)}\n\n`;
    })
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
      return `\n- ${stripTags(content)}`;
    })
    .replace(/<\/?(ul|ol)[^>]*>/gi, "\n")
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
      return `\n\n> ${stripTags(content)}\n\n`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "*$1*")
    .replace(/<[^>]*>/g, "");

  text = decodeEntities(text)
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return `${text}\n`;
}

function tokensFor(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

async function writeUtf8(relativePath, content) {
  const filePath = path.join(publicDir, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

function routeForArticle(article) {
  return `/${article.type}/${article.slug}`;
}

function markdownRouteForArticle(article) {
  return `/ai/${article.type}/${article.slug}.md`;
}

async function articleMarkdown(article) {
  const sourceMd = await readTextIfExists(
    path.join(rootDir, "content", article.type, `${article.slug}.md`),
  );
  const body = sourceMd
    ? sourceMd.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
    : htmlToMarkdown(article.contentHtml).trim();
  return `${frontmatter({
    title: pageTitle(article.title),
    description: article.desc,
    canonical: canonical(routeForArticle(article)),
    content_signal: CONTENT_SIGNAL,
    date: article.date,
    type: article.type,
  })}# ${article.title}

${article.desc ? `${article.desc}\n\n` : ""}${body}
`;
}

function articleListMarkdown(type, title, description, articles) {
  const items = articles
    .filter((article) => article.type === type)
    .map((article) => {
      return `- [${article.title}](${canonical(routeForArticle(article))}) ([Markdown](${markdownRouteForArticle(article)}))${
        article.desc ? ` - ${article.desc}` : ""
      }`;
    })
    .join("\n");

  return `${frontmatter({
    title: pageTitle(title),
    description,
    canonical: canonical(`/${type}`),
    content_signal: CONTENT_SIGNAL,
  })}# ${title}

${description}

${items || "暂无内容。"}
`;
}

function actionMarkdown(actions) {
  const items = actions
    .map((action) => `- **${action.name}** (${action.status}): ${action.desc}`)
    .join("\n");

  return `${frontmatter({
    title: pageTitle("行动"),
    description: "KiraMyao Equal 当前项目与行动入口。",
    canonical: canonical("/action"),
    content_signal: CONTENT_SIGNAL,
  })}# 行动

${items}
`;
}

function joinMarkdown(join) {
  return `${frontmatter({
    title: pageTitle("加入我们"),
    description: "参与调查、关注项目、支持 KiraMyao Equal。",
    canonical: canonical("/join"),
    content_signal: CONTENT_SIGNAL,
  })}# 加入我们

${join.description_markdown || htmlToMarkdown(join.description_html)}

## 参与入口

- ${join.survey_label || "Google Forms"}: ${join.survey_url}
- 腾讯问卷: ${join.tencent_survey_url}
- ${join.recruitment_label || "招募入口"}: ${join.recruitment_url}
- 联系与关注: ${join.twitter_url}
- 支持项目: ${join.donation_link}

${join.description_bottom_markdown || htmlToMarkdown(join.description_bottom_html)}
`;
}

function aboutMarkdown(about) {
  return `${frontmatter({
    title: pageTitle(about.title || "关于我们"),
    description: SITE_DESCRIPTION,
    canonical: canonical("/about"),
    content_signal: CONTENT_SIGNAL,
  })}# ${about.title || "关于我们"}

${about.content_markdown || htmlToMarkdown(about.content_html)}
`;
}

function aboutKiraMarkdown(about) {
  return `${frontmatter({
    title: pageTitle("About KiraMyao"),
    description: "KiraMyao Equal 网站维护者与项目整理者简介。",
    canonical: canonical("/about-kiramyao"),
    content_signal: CONTENT_SIGNAL,
  })}# About KiraMyao

${about.kiramyao_markdown || htmlToMarkdown(about.kiramyao_html)}
`;
}

function privacyMarkdown(privacy) {
  return `${frontmatter({
    title: pageTitle(privacy.title || "隐私与数据处理说明"),
    description: "KiraMyao Equal 的隐私、数据处理、问卷和公开资料整理说明。",
    canonical: canonical("/privacy"),
    content_signal: CONTENT_SIGNAL,
  })}# ${privacy.title || "隐私与数据处理说明"}

${privacy.content_markdown || htmlToMarkdown(privacy.content_html)}
`;
}

function indexMarkdown(homepageCards, articles, actions) {
  const cardLines = homepageCards
    .map((card) => `- **${card.title}**: ${card.desc}`)
    .join("\n");
  const articleLines = articles
    .map((article) => {
      return `- [${article.title}](${canonical(routeForArticle(article))}) ([Markdown](${markdownRouteForArticle(article)}))`;
    })
    .join("\n");
  const actionLines = actions
    .map((action) => `- **${action.name}**: ${action.desc}`)
    .join("\n");

  return `${frontmatter({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    canonical: canonical("/"),
    content_signal: CONTENT_SIGNAL,
  })}# ${SITE_TITLE}

${SITE_DESCRIPTION}

## 核心页面

- [关于我们](${canonical("/about")}) ([Markdown](/ai/about.md))
- [行动](${canonical("/action")}) ([Markdown](/ai/action.md))
- [博客](${canonical("/blog")}) ([Markdown](/ai/blog.md))
- [故事](${canonical("/story")}) ([Markdown](/ai/story.md))
- [报告](${canonical("/report")}) ([Markdown](/ai/report.md))
- [加入我们](${canonical("/join")}) ([Markdown](/ai/join.md))
- [隐私与数据处理说明](${canonical("/privacy")}) ([Markdown](/ai/privacy.md))

## 首页主题

${cardLines}

## 当前行动

${actionLines}

## 内容索引

${articleLines}
`;
}

function serviceDoc(catalog) {
  const resources = catalog.resources
    .map((resource) => `- [${resource.title}](${resource.href}) ([Markdown](${resource.markdown}))`)
    .join("\n");

  return `# ${SITE_TITLE} Agent Service Document

${SITE_DESCRIPTION}

## Discovery

- API catalog: ${canonical("/.well-known/api-catalog")}
- Agent card: ${canonical("/.well-known/agent-card.json")}
- Markdown index: ${canonical("/llms.txt")}
- Content signal: \`${CONTENT_SIGNAL}\`

## Markdown negotiation

Agents can request Markdown with \`Accept: text/markdown\`. On Cloudflare Pages, the generated \`_worker.js\` maps supported HTML URLs to their Markdown equivalents under \`/ai/\` and returns \`Content-Type: text/markdown; charset=utf-8\` with \`x-markdown-tokens\`.

## Resources

${resources}
`;
}

function llmsTxt(catalog) {
  const groups = new Map();
  for (const resource of catalog.resources) {
    const group = resource.kind || "page";
    groups.set(group, [...(groups.get(group) || []), resource]);
  }

  const section = (title, group) => {
    const rows = groups.get(group) || [];
    if (!rows.length) return "";
    return `## ${title}\n\n${rows
      .map((resource) => `- [${resource.title}](${resource.markdown}): ${resource.description || resource.href}`)
      .join("\n")}\n`;
  };

  return `# ${SITE_TITLE}

> ${SITE_DESCRIPTION}

Content-Signal: ${CONTENT_SIGNAL}

${section("Core Pages", "page")}
${section("Blog", "blog")}
${section("Story", "story")}
${section("Report", "report")}
`;
}

function workerSource() {
  return `const LINK_HEADER = ${JSON.stringify(LINK_HEADER)};
const CONTENT_SIGNAL = ${JSON.stringify(CONTENT_SIGNAL)};
const MARKDOWN_ROUTES = new Map([
  ["/", "/ai/index.md"],
  ["/index.html", "/ai/index.md"],
  ["/about", "/ai/about.md"],
  ["/about.html", "/ai/about.md"],
  ["/about-kiramyao", "/ai/about-kiramyao.md"],
  ["/about-kiramyao.html", "/ai/about-kiramyao.md"],
  ["/action", "/ai/action.md"],
  ["/action.html", "/ai/action.md"],
  ["/blog", "/ai/blog.md"],
  ["/blog.html", "/ai/blog.md"],
  ["/story", "/ai/story.md"],
  ["/story.html", "/ai/story.md"],
  ["/report", "/ai/report.md"],
  ["/report.html", "/ai/report.md"],
  ["/join", "/ai/join.md"],
  ["/join.html", "/ai/join.md"],
  ["/privacy", "/ai/privacy.md"],
  ["/privacy.html", "/ai/privacy.md"],
]);

function wantsMarkdown(request) {
  return (request.headers.get("accept") || "").toLowerCase().includes("text/markdown");
}

function addAgentHeaders(response, varyAccept = false) {
  const next = new Response(response.body, response);
  next.headers.set("Link", LINK_HEADER);
  next.headers.set("Content-Signal", CONTENT_SIGNAL);
  if (varyAccept) {
    const vary = next.headers.get("Vary");
    next.headers.set("Vary", vary ? \`\${vary}, Accept\` : "Accept");
  }
  return next;
}

function markdownPathFor(pathname) {
  if (MARKDOWN_ROUTES.has(pathname)) {
    return MARKDOWN_ROUTES.get(pathname);
  }

  const clean = pathname.replace(/\\/$/, "");
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 2 && ["blog", "story", "report"].includes(segments[0])) {
    return \`/ai/\${segments[0]}/\${segments[1]}.md\`;
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && wantsMarkdown(request)) {
      const markdownPath = markdownPathFor(url.pathname);
      if (markdownPath) {
        const markdownUrl = new URL(markdownPath, url);
        const response = await env.ASSETS.fetch(new Request(markdownUrl, request));
        if (response.ok) {
          const body = await response.text();
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "text/markdown; charset=utf-8",
              "Content-Signal": CONTENT_SIGNAL,
              "Link": LINK_HEADER,
              "Vary": "Accept",
              "x-markdown-tokens": String(Math.max(1, Math.ceil(body.length / 4))),
            },
          });
        }
      }
    }

    const response = await env.ASSETS.fetch(request);
    return addAgentHeaders(response, true);
  },
};
`;
}

function headersFile() {
  return `/
  Link: ${LINK_HEADER}
  Content-Signal: ${CONTENT_SIGNAL}
  Vary: Accept

/*
  Link: ${LINK_HEADER}
  Content-Signal: ${CONTENT_SIGNAL}
  Vary: Accept

/ai/*
  Content-Type: text/markdown; charset=utf-8

/.well-known/api-catalog
  Content-Type: application/json; charset=utf-8

/.well-known/api-catalog.json
  Content-Type: application/json; charset=utf-8

/.well-known/agent-card.json
  Content-Type: application/json; charset=utf-8

/.well-known/service-doc.md
  Content-Type: text/markdown; charset=utf-8

/llms.txt
  Content-Type: text/plain; charset=utf-8
`;
}

function robotsTxt() {
  return `User-Agent: *
Allow: /

Content-Signal: ${CONTENT_SIGNAL}

Host: ${SITE_HOST}
Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function dnsAidExample() {
  return `# DNS-AID publication notes for ${SITE_HOST}
#
# These records cannot be shipped by the static website itself. Publish them in
# the authoritative DNS zone for ${SITE_HOST}, then enable DNSSEC on the zone.
# DNS-AID is still an Internet-Draft, so confirm the exact SVCB/HTTPS parameter
# support in your DNS provider before deploying.

_index._agents.${SITE_HOST}. 3600 IN HTTPS 1 ${SITE_HOST}. alpn="h2,h3" endpoint="https://${SITE_HOST}/.well-known/api-catalog"
_a2a._agents.${SITE_HOST}. 3600 IN HTTPS 1 ${SITE_HOST}. alpn="h2,h3" endpoint="https://${SITE_HOST}/.well-known/agent-card.json"
_service-doc._agents.${SITE_HOST}. 3600 IN HTTPS 1 ${SITE_HOST}. alpn="h2,h3" endpoint="https://${SITE_HOST}/.well-known/service-doc.md"
`;
}

async function main() {
  const [compiledArticles, about, join, privacy, actions, homepageCards] =
    await Promise.all([
      readJson("src/data/compiled_articles.json"),
      readJson("src/data/about.json"),
      readJson("src/data/join.json"),
      readJson("src/data/privacy.json"),
      readJson("src/data/actions.json"),
      readJson("src/data/homepage_bento.json"),
    ]);

  await mkdir(wellKnownDir, { recursive: true });
  await mkdir(aiDir, { recursive: true });

  const coreResources = [
    {
      kind: "page",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      href: canonical("/"),
      markdown: "/ai/index.md",
    },
    {
      kind: "page",
      title: "关于我们",
      description: SITE_DESCRIPTION,
      href: canonical("/about"),
      markdown: "/ai/about.md",
    },
    {
      kind: "page",
      title: "About KiraMyao",
      description: "KiraMyao Equal 网站维护者与项目整理者简介。",
      href: canonical("/about-kiramyao"),
      markdown: "/ai/about-kiramyao.md",
    },
    {
      kind: "page",
      title: "行动",
      description: "KiraMyao Equal 当前项目与行动入口。",
      href: canonical("/action"),
      markdown: "/ai/action.md",
    },
    {
      kind: "page",
      title: "加入我们",
      description: "参与调查、关注项目、支持 KiraMyao Equal。",
      href: canonical("/join"),
      markdown: "/ai/join.md",
    },
    {
      kind: "page",
      title: "隐私与数据处理说明",
      description: "KiraMyao Equal 的隐私、数据处理、问卷和公开资料整理说明。",
      href: canonical("/privacy"),
      markdown: "/ai/privacy.md",
    },
  ];

  const articleResources = compiledArticles.map((article) => ({
    kind: article.type,
    title: article.title,
    description: article.desc,
    href: canonical(routeForArticle(article)),
    markdown: markdownRouteForArticle(article),
    date: article.date,
  }));

  const catalog = {
    version: 1,
    title: `${SITE_TITLE} Agent Discovery Catalog`,
    description: SITE_DESCRIPTION,
    homepage: canonical("/"),
    generatedAt: new Date().toISOString(),
    contentSignal: CONTENT_SIGNAL,
    links: [
      { rel: "service-doc", href: canonical("/.well-known/service-doc.md"), type: "text/markdown" },
      { rel: "alternate", href: canonical("/llms.txt"), type: "text/markdown" },
      { rel: "agent-card", href: canonical("/.well-known/agent-card.json"), type: "application/json" },
    ],
    markdownNegotiation: {
      accept: "text/markdown",
      contentType: "text/markdown; charset=utf-8",
      tokenHeader: "x-markdown-tokens",
      fallbackIndex: canonical("/llms.txt"),
    },
    resources: [...coreResources, ...articleResources],
  };

  await writeUtf8("robots.txt", robotsTxt());
  await writeUtf8("_headers", headersFile());
  await writeUtf8("_worker.js", workerSource());
  await writeUtf8("llms.txt", llmsTxt(catalog));
  await writeUtf8(".well-known/api-catalog", JSON.stringify(catalog, null, 2));
  await writeUtf8(".well-known/api-catalog.json", JSON.stringify(catalog, null, 2));
  await writeUtf8(".well-known/service-doc.md", serviceDoc(catalog));
  await writeUtf8(
    ".well-known/agent-card.json",
    JSON.stringify(
      {
        name: SITE_TITLE,
        url: canonical("/"),
        description: SITE_DESCRIPTION,
        contentSignal: CONTENT_SIGNAL,
        capabilities: [
          "agent-discovery-link-headers",
          "markdown-negotiation",
          "content-signals",
          "dns-aid-publication-notes",
        ],
        links: catalog.links,
      },
      null,
      2,
    ),
  );
  await writeUtf8(".well-known/dns-aid.example.txt", dnsAidExample());

  await writeUtf8("ai/index.md", indexMarkdown(homepageCards, compiledArticles, actions));
  await writeUtf8("ai/about.md", aboutMarkdown(about));
  await writeUtf8("ai/about-kiramyao.md", aboutKiraMarkdown(about));
  await writeUtf8("ai/action.md", actionMarkdown(actions));
  await writeUtf8(
    "ai/blog.md",
    articleListMarkdown(
      "blog",
      "博客",
      "KiraMyao Equal 发布的文章、问卷说明和资料整理。",
      compiledArticles,
    ),
  );
  await writeUtf8(
    "ai/story.md",
    articleListMarkdown("story", "故事", "社群故事、项目记录与叙事内容。", compiledArticles),
  );
  await writeUtf8(
    "ai/report.md",
    articleListMarkdown("report", "报告", "KiraMyao Equal 整理和发布的报告内容。", compiledArticles),
  );
  await writeUtf8("ai/join.md", joinMarkdown(join));
  await writeUtf8("ai/privacy.md", privacyMarkdown(privacy));

  for (const article of compiledArticles) {
    await writeUtf8(`ai/${article.type}/${article.slug}.md`, await articleMarkdown(article));
  }

  console.log(
    `Generated agent assets: ${catalog.resources.length} resources, ${tokensFor(
      JSON.stringify(catalog),
    )} catalog tokens approx.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
