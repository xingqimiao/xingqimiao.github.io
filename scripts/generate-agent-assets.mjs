import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodejieba from "nodejieba";
import { parse } from "node-html-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const globalConfig = JSON.parse(
  await readFile(path.join(rootDir, "src", "data", "global_config.json"), "utf8"),
);
export const SITE_URL = String(globalConfig.website_url || "https://kiraequal.org").replace(/\/+$/, "");
export const SITE_HOST = new URL(SITE_URL).host;
const SITE_TITLE = "KiraMyao Equal";
const SITE_DESCRIPTION =
  "KiraMyao Equal 关注中国跨性别与性别多元群体的生存处境、社群故事、资料整理和公共倡议，发布调查、报告、文章与参与方式。";
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";
export const STORY_SLUG_ALIASES = Object.freeze({
  "88737526": "45648863",
  "cat-birthday-17-kira": "45648863",
});
export const CAT_CAVE_SLUG_ALIASES = Object.freeze({
  "2026-trans-survival-survey": "2026-transgender-survival-survey",
  "Becoming-a-Cat-cat!": "becoming-a-cat-a-story-about-srs",
});
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
  return text.replace(/&(?:#x[0-9a-f]+|#\d+|amp|lt|gt|quot|nbsp);/gi, (entity) => {
    switch (entity.toLowerCase()) {
      case "&nbsp;":
        return " ";
      case "&amp;":
        return "&";
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      default:
        if (entity.startsWith("&#x")) {
          return String.fromCodePoint(Number.parseInt(entity.slice(3, -1), 16));
        }
        return String.fromCodePoint(Number.parseInt(entity.slice(2, -1), 10));
    }
  });
}

function stripUnsafeNodes(root) {
  for (const node of root.querySelectorAll("script, style")) {
    node.remove();
  }
}

function renderInline(node) {
  const parts = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      parts.push(child.rawText);
      continue;
    }
    if (child.nodeType !== 1) continue;
    const tag = (child.rawTagName || "").toLowerCase();
    if (tag === "br") {
      parts.push("\n");
    } else if (tag === "img") {
      const src = child.getAttribute("src") || "";
      const alt = child.getAttribute("alt") || "";
      parts.push(src ? `\n\n![${alt}](${src})\n\n` : "");
    } else if (tag === "a") {
      const href = child.getAttribute("href") || "";
      const label = renderInline(child).trim();
      parts.push(href ? `[${label}](${href})` : label);
    } else if (tag === "strong" || tag === "b") {
      parts.push(`**${renderInline(child)}**`);
    } else if (tag === "em" || tag === "i") {
      parts.push(`*${renderInline(child)}*`);
    } else if (tag === "code") {
      parts.push(`\`${child.rawText}\``);
    } else {
      parts.push(renderInline(child));
    }
  }
  return parts.join("");
}

function htmlToMarkdown(html = "") {
  const source = String(html).replace(/\r/g, "");
  if (!source.trim()) return "";
  const root = parse(source);
  stripUnsafeNodes(root);

  const blocks = [];
  const walk = (node) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const text = child.rawText.trim();
        if (text) blocks.push(text);
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = (child.rawTagName || "").toLowerCase();
      const heading = tag.match(/^h([1-6])$/);
      if (heading) {
        const content = renderInline(child).trim();
        if (content) blocks.push(`\n\n${"#".repeat(Number(heading[1]))} ${content}\n\n`);
      } else if (tag === "p") {
        const content = renderInline(child).trim();
        if (content) blocks.push(`${content}\n\n`);
      } else if (tag === "ul" || tag === "ol") {
        for (const item of child.childNodes) {
          if (item.nodeType !== 1 || (item.rawTagName || "").toLowerCase() !== "li") continue;
          const content = renderInline(item).trim();
          if (content) blocks.push(`\n- ${content}`);
        }
      } else if (tag === "li") {
        const content = renderInline(child).trim();
        if (content) blocks.push(`\n- ${content}`);
      } else if (tag === "blockquote") {
        const content = renderInline(child).trim();
        if (content) blocks.push(`\n\n> ${content}\n\n`);
      } else if (tag === "br") {
        blocks.push("\n");
      } else if (tag === "img") {
        const rendered = renderInline(child).trim();
        if (rendered) blocks.push(rendered);
      } else {
        walk(child);
      }
    }
  };
  walk(root);

  const text = decodeEntities(blocks.join(""))
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text ? `${text}\n` : "";
}

function searchTokensFor(text) {
  const parsed = parse(String(text || ""));
  stripUnsafeNodes(parsed);
  const normalized = decodeEntities(parsed.rawText || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!normalized) return [];
  try {
    return Array.from(new Set(nodejieba.cutForSearch(normalized).filter((token) => token.trim().length > 0)));
  } catch {
    return Array.from(new Set(normalized.split(/[\s,，。！？；：、"'“”‘’()[\]{}<>《》|/\\]+/).filter(Boolean)));
  }
}

export function articleSearchIndex(articles, locale = "zh", now = () => new Date()) {
  const tokens = {};
  for (const article of articles) {
    const usesEnglish = locale === "en" && hasCompleteEnglishArticle(article);
    const isStory = article.type === "stories";
    const metadata = isStory
      ? [
          usesEnglish ? article.englishTitle : article.title,
          article.date,
          article.type,
          ...(Array.isArray(article.keywords) ? article.keywords : []),
        ]
      : [
          usesEnglish ? article.englishTitle : article.title,
          usesEnglish ? article.englishDescription : article.desc,
          article.date,
          article.type,
          article.seoDescription,
          ...(Array.isArray(article.keywords) ? article.keywords : []),
        ];
    const body = usesEnglish ? article.englishContentHtml : article.contentHtml;
    tokens[article.slug] = searchTokensFor(`${metadata.join(" ")} ${body || ""}`);
  }

  return {
    version: 1,
    language: locale === "en" ? "en" : "zh-CN",
    generatedAt: now().toISOString(),
    tokens,
  };
}

async function writeUtf8At(outputDir, relativePath, content) {
  const filePath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

export async function reconcileMarkdownDirectory(directoryPath, expectedFileNames) {
  const resolvedDirectory = path.resolve(directoryPath);
  await mkdir(resolvedDirectory, { recursive: true });
  const expected = new Set(
    expectedFileNames.map((fileName) => {
      if (path.basename(fileName) !== fileName || !fileName.endsWith(".md")) {
        throw new Error(`Unsafe Markdown reconciliation target: ${fileName}`);
      }
      return fileName;
    }),
  );
  const entries = await readdir(resolvedDirectory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    if (entry.isFile() && entry.name.endsWith(".md") && !expected.has(entry.name)) {
      await rm(path.join(resolvedDirectory, entry.name), { force: true });
    }
  }));
}

function routeForArticle(article, locale = "zh") {
  const section = article.type === "blog" ? "cat-cave" : article.type;
  const route = `/${section}/${article.slug}`;
  return locale === "en" ? `/en${route}` : route;
}

function markdownRouteForArticle(article, locale = "zh") {
  const section = article.type === "blog" ? "cat-cave" : article.type;
  return `/ai/${locale === "en" ? "en/" : ""}${section}/${article.slug}.md`;
}

export function articleResource(article, locale = "zh") {
  const usesEnglish = locale === "en" && hasCompleteEnglishArticle(article);
  const resource = {
    kind: article.type,
    title: usesEnglish ? article.englishTitle : article.title,
    href: canonical(routeForArticle(article, locale)),
    markdown: markdownRouteForArticle(article, locale),
    date: article.date,
    language: locale === "en" ? "en" : "zh-CN",
  };
  if (article.type !== "stories") {
    resource.description = usesEnglish
      ? article.englishDescription || article.seoDescription
      : article.desc || article.seoDescription;
  }
  if (locale === "en" && !usesEnglish) {
    resource.translationFallback = true;
  }
  return resource;
}

export const ENGLISH_FALLBACK_NOTICE =
  "English translation is not available yet. The complete Chinese original follows.";

export function hasCompleteEnglishArticle(article) {
  return Boolean(
    article.englishTitle?.trim()
    && article.englishContentHtml?.trim()
    && htmlToMarkdown(article.englishContentHtml).trim(),
  );
}

export async function articleMarkdown(
  article,
  { locale = "zh", sourceMarkdown } = {},
) {
  const usesEnglish = locale === "en" && hasCompleteEnglishArticle(article);
  let sourceMd = sourceMarkdown;
  if (!usesEnglish && sourceMd === undefined) {
    sourceMd = await readTextIfExists(
      path.join(rootDir, "content", article.type, `${article.slug}.md`),
    );
  }
  const body = usesEnglish
    ? htmlToMarkdown(article.englishContentHtml).trim()
    : sourceMd
      ? sourceMd.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
      : htmlToMarkdown(article.contentHtml).trim();
  const title = usesEnglish ? article.englishTitle : article.title;
  const isStory = article.type === "stories";
  const fallbackNotice = locale === "en" && !usesEnglish
    ? `> ${ENGLISH_FALLBACK_NOTICE}\n\n`
    : "";
  return `${frontmatter({
    title: pageTitle(title),
    description: isStory
      ? undefined
      : usesEnglish
        ? article.englishDescription || article.seoDescription
        : article.seoDescription || article.desc,
    title_zh: article.title,
    description_zh: isStory ? undefined : article.desc,
    keywords: Array.isArray(article.keywords) ? article.keywords.join(', ') : '',
    canonical: canonical(routeForArticle(article, locale)),
    content_signal: CONTENT_SIGNAL,
    date: article.date,
    type: article.type,
    language: locale === "en" ? "en" : "zh-CN",
  })}${fallbackNotice}# ${title}

${body}
`;
}

export function articleListMarkdown(type, title, description, articles, locale = "zh") {
  const items = articles
    .filter((article) => article.type === type)
    .map((article) => {
      const usesEnglish = locale === "en" && hasCompleteEnglishArticle(article);
      const articleTitle = usesEnglish ? article.englishTitle : article.title;
      const fallback = locale === "en" && !usesEnglish
        ? " - English translation unavailable; complete Chinese original provided."
        : "";
      const summary = article.type === "stories"
        ? ""
        : usesEnglish
          ? article.englishDescription || ""
          : article.desc || "";
      return `- [${articleTitle}](${canonical(routeForArticle(article, locale))}) ([Markdown](${markdownRouteForArticle(article, locale)}))${
        summary ? ` - ${summary}` : fallback
      }`;
    })
    .join("\n");

  return `${frontmatter({
    title: pageTitle(title),
    description,
    canonical: canonical(`${locale === "en" ? "/en" : ""}${type === "blog" ? "/cat-cave" : `/${type}`}`),
    content_signal: CONTENT_SIGNAL,
  })}# ${title}

${description}

${items || "暂无内容。"}
`;
}

const ENGLISH_HOMEPAGE_CARDS = Object.freeze({
  1: {
    title: "Annual Community Survey",
    desc: "We examine each research question rigorously and turn complex analysis into clear, accessible reports with structured insights.",
  },
  2: {
    title: "Transgender Public Education",
    desc: "We carry community voices into public conversation so valuable ideas can travel farther.",
  },
  3: {
    title: "Practical Guides",
    desc: "We organize hard-earned lessons, detailed guides, and common questions so fewer people have to navigate alone.",
  },
  4: {
    title: "Stories",
    desc: "We preserve the paths people have taken, moments of light, and intimate accounts of growth and companionship.",
  },
});

function localizedHomepageCard(card, locale) {
  if (locale !== "en") return card;
  const english = ENGLISH_HOMEPAGE_CARDS[card.id];
  return english || {
    title: `English translation unavailable — ${card.title}`,
    desc: `${ENGLISH_FALLBACK_NOTICE} ${card.desc}`,
  };
}

const ENGLISH_ACTIONS = Object.freeze({
  "1": {
    name: "2026 Community Conditions Survey",
    desc: "This survey documents the lived conditions of transgender communities in China. Visit the Join Us page to take part in the work.",
  },
  "4": {
    name: "China Transgender Survival Guide 2.0",
    desc: "A revision of version 1.0 based on community feedback and survey research into recurring practical needs.",
  },
});

const ENGLISH_ACTION_STATUS = Object.freeze({
  running: "In progress",
  paused: "Paused",
  completed: "Completed",
  delayed: "Delayed",
  failed: "Failed",
});

function localizedAction(action, locale) {
  if (locale !== "en") return action;
  const english = ENGLISH_ACTIONS[action.id];
  return {
    ...action,
    name: english?.name || `English translation unavailable — ${action.name}`,
    desc: english?.desc || `${ENGLISH_FALLBACK_NOTICE} ${action.desc}`,
    status: ENGLISH_ACTION_STATUS[action.status] || action.status,
  };
}

function actionMarkdown(actions, locale = "zh") {
  const items = actions
    .map((action) => {
      const localized = localizedAction(action, locale);
      return `- **${localized.name}** (${localized.status}): ${localized.desc}`;
    })
    .join("\n");
  const title = locale === "en" ? "Projects" : "行动";

  return `${frontmatter({
    title: pageTitle(title),
    description: locale === "en"
      ? "Current KiraMyao Equal projects and ways to participate."
      : "KiraMyao Equal 当前项目与行动入口。",
    canonical: canonical(locale === "en" ? "/en/action" : "/action"),
    content_signal: CONTENT_SIGNAL,
    language: locale === "en" ? "en" : "zh-CN",
  })}# ${title}

${items || (locale === "en" ? "No current projects." : "暂无项目。")}
`;
}

function staticMarkdownField(record, markdownField, htmlField, locale) {
  const chinese = record[markdownField] || htmlToMarkdown(record[htmlField] || "").trim();
  if (locale !== "en") {
    return chinese;
  }
  const english = record[`${markdownField}_en`];
  if (typeof english === "string" && english.trim()) {
    return english;
  }
  return `> ${ENGLISH_FALLBACK_NOTICE}\n\n${chinese}`;
}

const ENGLISH_JOIN_LINK_LABELS = Object.freeze({
  "google-survey": "Take part in the 2026 survey on challenges facing transgender people in China",
  "tencent-survey": "Take part in the 2026 survey (Tencent Survey)",
  "volunteer-recruitment": "Join KiraMyao Equal | Volunteer application",
});

function englishJoinLinkLabel(item) {
  return item.label_en
    || ENGLISH_JOIN_LINK_LABELS[item.id]
    || `English translation unavailable — ${item.label}`;
}

function englishJoinLinkSource(source) {
  if (source === "腾讯问卷") return "Tencent Survey";
  return source;
}

export function joinMarkdown(join, joinLinks, locale = "zh") {
  const entries = joinLinks
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const label = locale === "en" ? englishJoinLinkLabel(item) : item.label;
      const source = locale === "en" ? englishJoinLinkSource(item.source) : item.source;
      const sourceSuffix = label.includes(`(${source})`) ? "" : ` (${source})`;
      return `- ${label}${sourceSuffix}: ${item.url}`;
    })
    .join("\n");
  const title = locale === "en" ? join.englishTitle || "Join us" : join.title || "加入我们";
  return `${frontmatter({
    title: pageTitle(title),
    description: locale === "en"
      ? join.englishDescription || "Ways to participate in and support KiraMyao Equal."
      : join.seoDescription || "参与调查、关注项目、支持 KiraMyao Equal。",
    canonical: canonical(locale === "en" ? "/en/join" : "/join"),
    content_signal: CONTENT_SIGNAL,
    language: locale === "en" ? "en" : "zh-CN",
  })}# ${title}

${staticMarkdownField(join, "description_markdown", "description_html", locale)}

${entries ? `## ${locale === "en" ? "Participation links" : "参与入口"}\n\n${entries}\n` : ""}
${join.twitter_url ? `- ${locale === "en" ? "Contact and follow" : "联系与关注"}: ${join.twitter_url}\n` : ""}${join.donation_link ? `- ${locale === "en" ? "Support the project" : "支持项目"}: ${join.donation_link}\n` : ""}

${staticMarkdownField(join, "description_bottom_markdown", "description_bottom_html", locale)}
`;
}

export function aboutKiraMarkdown(about, locale = "zh") {
  const title = locale === "en" ? "About KiraMyao" : "关于 KiraMyao";
  return `${frontmatter({
    title: pageTitle(title),
    description: locale === "en"
      ? about.englishDescription || "About the maintainer and project organizer of KiraMyao Equal."
      : about.seoDescription || "KiraMyao Equal 网站维护者与项目整理者简介。",
    canonical: canonical(locale === "en" ? "/en/about" : "/about"),
    content_signal: CONTENT_SIGNAL,
    language: locale === "en" ? "en" : "zh-CN",
  })}# ${title}

${staticMarkdownField(about, "kiramyao_markdown", "kiramyao_html", locale)}
`;
}

export function privacyMarkdown(privacy, locale = "zh") {
  const title = locale === "en"
    ? privacy.englishTitle || "Privacy and data processing"
    : privacy.title || "隐私与数据处理说明";
  return `${frontmatter({
    title: pageTitle(title),
    description: locale === "en"
      ? privacy.englishDescription || "Privacy and data processing information for KiraMyao Equal."
      : privacy.seoDescription || "KiraMyao Equal 的隐私、数据处理、问卷和公开资料整理说明。",
    canonical: canonical(locale === "en" ? "/en/privacy" : "/privacy"),
    content_signal: CONTENT_SIGNAL,
    language: locale === "en" ? "en" : "zh-CN",
  })}# ${title}

${staticMarkdownField(privacy, "content_markdown", "content_html", locale)}
`;
}

function indexMarkdown(homepageCards, articles, actions, locale = "zh") {
  const isEnglish = locale === "en";
  const cardLines = homepageCards
    .map((card) => {
      const localized = localizedHomepageCard(card, locale);
      return `- **${localized.title}**: ${localized.desc}`;
    })
    .join("\n");
  const articleLines = articles
    .map((article) => {
      const usesEnglish = isEnglish && hasCompleteEnglishArticle(article);
      const title = usesEnglish ? article.englishTitle : article.title;
      const fallback = isEnglish && !usesEnglish
        ? " - English translation unavailable; complete Chinese original provided."
        : "";
      return `- [${title}](${canonical(routeForArticle(article, locale))}) ([Markdown](${markdownRouteForArticle(article, locale)}))${fallback}`;
    })
    .join("\n");
  const actionLines = actions
    .map((action) => {
      const localized = localizedAction(action, locale);
      return `- **${localized.name}**: ${localized.desc}`;
    })
    .join("\n");
  const description = isEnglish
    ? "KiraMyao Equal documents transgender and gender-diverse lives in China through research, stories, resources, and public advocacy."
    : SITE_DESCRIPTION;
  const aiPrefix = isEnglish ? "/ai/en" : "/ai";
  const routePrefix = isEnglish ? "/en" : "";

  return `${frontmatter({
    title: SITE_TITLE,
    description,
    canonical: canonical(isEnglish ? "/en" : "/"),
    content_signal: CONTENT_SIGNAL,
    language: isEnglish ? "en" : "zh-CN",
  })}# ${SITE_TITLE}

${description}

## ${isEnglish ? "Core pages" : "核心页面"}

- [About us](${canonical(`${routePrefix}/about`)}) ([Markdown](${aiPrefix}/about.md))
- [Stories](${canonical(`${routePrefix}/stories`)}) ([Markdown](${aiPrefix}/stories.md))
- [Reports](${canonical(`${routePrefix}/report`)}) ([Markdown](${aiPrefix}/report.md))
- [Documents](${canonical(`${routePrefix}/documents`)}) ([Markdown](${aiPrefix}/documents.md))
- [Projects](${canonical(`${routePrefix}/action`)}) ([Markdown](${aiPrefix}/action.md))
- [Cat Cave](${canonical(`${routePrefix}/cat-cave`)}) ([Markdown](${aiPrefix}/cat-cave.md))
- [${isEnglish ? "Join us" : "加入我们"}](${canonical(`${routePrefix}/join`)}) ([Markdown](${aiPrefix}/join.md))
- [${isEnglish ? "Privacy and data processing" : "隐私与数据处理说明"}](${canonical(`${routePrefix}/privacy`)}) ([Markdown](${aiPrefix}/privacy.md))

## ${isEnglish ? "Homepage topics" : "首页主题"}

${cardLines}

## ${isEnglish ? "Current projects" : "当前行动"}

${actionLines}

## ${isEnglish ? "Content index" : "内容索引"}

${articleLines}
`;
}

function coreResourcesFor(locale, about, join, privacy) {
  const isEnglish = locale === "en";
  const routePrefix = isEnglish ? "/en" : "";
  const markdownPrefix = isEnglish ? "/ai/en" : "/ai";
  const page = (title, description, route, markdown) => ({
    kind: "page",
    title,
    ...(description ? { description } : {}),
    href: canonical(`${routePrefix}${route}` || "/"),
    markdown: `${markdownPrefix}${markdown}`,
    language: isEnglish ? "en" : "zh-CN",
  });
  return [
    page(SITE_TITLE, isEnglish
      ? "KiraMyao Equal research, stories, resources, and public advocacy."
      : SITE_DESCRIPTION, "", "/index.md"),
    page(
      isEnglish ? "About KiraMyao" : "关于 KiraMyao",
      isEnglish
        ? about.englishDescription || "About the maintainer and project organizer of KiraMyao Equal."
        : about.seoDescription || "KiraMyao Equal 网站维护者与项目整理者简介。",
      "/about",
      "/about.md",
    ),
    page(isEnglish ? "Stories" : "故事", undefined, "/stories", "/stories.md"),
    page(isEnglish ? "Reports" : "报告", isEnglish
      ? "KiraMyao Equal reports and research materials."
      : "KiraMyao Equal 整理和发布的报告内容。", "/report", "/report.md"),
    page(isEnglish ? "Documents" : "资料", isEnglish
      ? "Reference documents and materials from KiraMyao Equal."
      : "KiraMyao Equal 整理的参考资料。", "/documents", "/documents.md"),
    page(isEnglish ? "Projects" : "行动", isEnglish
      ? "Current KiraMyao Equal projects and ways to participate."
      : "KiraMyao Equal 当前项目与行动入口。", "/action", "/action.md"),
    page("Cat Cave", isEnglish
      ? "KiraMyao Equal posts, reflections, and community notes."
      : "KiraMyao Equal 的文章、随笔与社群记录。", "/cat-cave", "/cat-cave.md"),
    page(isEnglish ? join.englishTitle || "Join us" : join.title || "加入我们", isEnglish
      ? join.englishDescription || "Ways to participate in and support KiraMyao Equal."
      : join.seoDescription || "参与调查、关注项目、支持 KiraMyao Equal。", "/join", "/join.md"),
    page(isEnglish ? privacy.englishTitle || "Privacy and data processing" : privacy.title || "隐私与数据处理说明", isEnglish
      ? privacy.englishDescription || "Privacy and data processing information for KiraMyao Equal."
      : privacy.seoDescription || "KiraMyao Equal 的隐私与数据处理说明。", "/privacy", "/privacy.md"),
  ];
}

export function buildCatalog({ locale = "zh", compiledArticles, about, join, privacy, now = () => new Date() }) {
  const isEnglish = locale === "en";
  const resources = [
    ...coreResourcesFor(locale, about, join, privacy),
    ...compiledArticles.map((article) => articleResource(article, locale)),
  ];
  const serviceDocPath = isEnglish
    ? "/.well-known/service-doc.en.md"
    : "/.well-known/service-doc.md";
  const llmsPath = isEnglish ? "/llms-en.txt" : "/llms.txt";
  return {
    version: 1,
    language: isEnglish ? "en" : "zh-CN",
    title: `${SITE_TITLE} Agent Discovery Catalog`,
    description: isEnglish
      ? "KiraMyao Equal research, stories, resources, and public advocacy."
      : SITE_DESCRIPTION,
    homepage: canonical(isEnglish ? "/en" : "/"),
    generatedAt: now().toISOString(),
    contentSignal: CONTENT_SIGNAL,
    links: [
      { rel: "service-doc", href: canonical(serviceDocPath), type: "text/markdown" },
      { rel: "alternate", href: canonical(llmsPath), type: "text/markdown" },
      { rel: "agent-card", href: canonical("/.well-known/agent-card.json"), type: "application/json" },
    ],
    markdownNegotiation: {
      accept: "text/markdown",
      contentType: "text/markdown; charset=utf-8",
      tokenHeader: "x-markdown-tokens",
      fallbackIndex: canonical(llmsPath),
    },
    resources,
  };
}

function serviceDoc(catalog) {
  const resources = catalog.resources
    .map((resource) => `- [${resource.title}](${resource.href}) ([Markdown](${resource.markdown}))`)
    .join("\n");

  return `# ${SITE_TITLE} Agent Service Document

${catalog.description}

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

> ${catalog.description}

Content-Signal: ${CONTENT_SIGNAL}

${section("Core Pages", "page")}
${section("Cat Cave", "blog")}
${section("Stories", "stories")}
${section("Reports", "report")}
${section("Documents", "documents")}
`;
}

export function workerSource() {
  return `const LINK_HEADER = ${JSON.stringify(LINK_HEADER)};
const CONTENT_SIGNAL = ${JSON.stringify(CONTENT_SIGNAL)};
export const STORY_SLUG_ALIASES = Object.freeze(${JSON.stringify(STORY_SLUG_ALIASES)});
export const CAT_CAVE_SLUG_ALIASES = Object.freeze(${JSON.stringify(CAT_CAVE_SLUG_ALIASES)});
const PAGE_PATH_ALIASES = Object.freeze({
  "/about-kiramyao": "/about",
  "/about-kiramyao.html": "/about",
});
const MARKDOWN_ROUTES = new Map([
  ["/", "/ai/index.md"],
  ["/index.html", "/ai/index.md"],
  ["/about", "/ai/about.md"],
  ["/about.html", "/ai/about.md"],
  ["/action", "/ai/action.md"],
  ["/action.html", "/ai/action.md"],
  ["/cat-cave", "/ai/cat-cave.md"],
  ["/cat-cave.html", "/ai/cat-cave.md"],
  ["/documents", "/ai/documents.md"],
  ["/documents.html", "/ai/documents.md"],
  ["/report", "/ai/report.md"],
  ["/report.html", "/ai/report.md"],
  ["/stories", "/ai/stories.md"],
  ["/stories.html", "/ai/stories.md"],
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
  if (segments.length === 2 && ["cat-cave", "documents", "report", "stories"].includes(segments[0])) {
    return \`/ai/\${segments[0]}/\${segments[1].replace(/\\.html$/, "")}.md\`;
  }
  return null;
}

function slugAliasRedirect(url) {
  const segments = url.pathname.replace(/\\\/$/, "").split("/").filter(Boolean);
  if (segments.length !== 2) return null;
  const aliases =
    segments[0] === "stories"
      ? STORY_SLUG_ALIASES
      : segments[0] === "cat-cave"
        ? CAT_CAVE_SLUG_ALIASES
        : null;
  if (!aliases) return null;
  let replacement = aliases[segments[1]];
  if (!replacement) {
    let decoded = segments[1];
    try {
      decoded = decodeURIComponent(segments[1]);
    } catch {}
    replacement = aliases[decoded];
  }
  if (!replacement) return null;
  segments[1] = replacement;
  url.pathname = \`/\${segments.join("/")}\`;
  return new Response(null, {
    status: 308,
    headers: { Location: url.toString() },
  });
}

function pagePathRedirect(url) {
  const target = PAGE_PATH_ALIASES[url.pathname];
  if (!target) return null;
  url.pathname = target;
  return new Response(null, {
    status: 308,
    headers: { Location: url.toString() },
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const aliasRedirect = slugAliasRedirect(url);
    if (aliasRedirect) return aliasRedirect;
    const pageRedirect = pagePathRedirect(url);
    if (pageRedirect) return pageRedirect;

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

export default worker;
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
# Published as HTTPS (SVCB) records in the Cloudflare zone for ${SITE_HOST}
# with DNSSEC enabled on the zone (verified AD=true by isitagentready.com).
# These records cannot be shipped by the static website itself; manage them
# in the Cloudflare dashboard under DNS > Records, type HTTPS.
# See https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/

_index._agents.${SITE_HOST}. 300 IN HTTPS 1 ${SITE_HOST}. alpn="h2,h3" port=443
_a2a._agents.${SITE_HOST}. 300 IN HTTPS 1 ${SITE_HOST}. alpn="h2,h3" port=443
`;
}

export async function generateAgentAssets({
  outputDir,
  compiledArticles,
  about,
  join,
  joinLinks,
  privacy,
  actions,
  homepageCards,
  now = () => new Date(),
  sourceMarkdownFor = async (article) => readTextIfExists(
    path.join(rootDir, "content", article.type, `${article.slug}.md`),
  ),
}) {
  const outputAiDir = path.join(outputDir, "ai");
  const outputWellKnownDir = path.join(outputDir, ".well-known");
  await mkdir(outputAiDir, { recursive: true });
  await mkdir(outputWellKnownDir, { recursive: true });

  for (const legacyPath of ["about.md", "blog.md", "blog", "story.md", "story"]) {
    await rm(path.join(outputAiDir, legacyPath), { force: true, recursive: true });
  }

  const currentStoryFiles = compiledArticles
    .filter((article) => article.type === "stories")
    .map((article) => `${article.slug}.md`);
  await reconcileMarkdownDirectory(path.join(outputAiDir, "stories"), currentStoryFiles);

  const zhCatalog = buildCatalog({
    locale: "zh",
    compiledArticles,
    about,
    join,
    privacy,
    now,
  });

  const write = (relativePath, content) => writeUtf8At(outputDir, relativePath, content);
  await write("robots.txt", robotsTxt());
  await write("_headers", headersFile());
  await write("_worker.js", workerSource());
  await write("llms.txt", llmsTxt(zhCatalog));
  await write(".well-known/api-catalog", JSON.stringify(zhCatalog, null, 2));
  await write(".well-known/api-catalog.json", JSON.stringify(zhCatalog, null, 2));
  await write(".well-known/service-doc.md", serviceDoc(zhCatalog));
  await write(
    ".well-known/agent-card.json",
    JSON.stringify({
      name: SITE_TITLE,
      url: canonical("/"),
      description: SITE_DESCRIPTION,
      contentSignal: CONTENT_SIGNAL,
      capabilities: [
        "agent-discovery-link-headers",
        "content-signals",
        "dns-aid-publication-notes",
      ],
      links: [
        ...zhCatalog.links,
      ],
    }, null, 2),
  );
  await write(".well-known/dns-aid.example.txt", dnsAidExample());

  const listSpecs = [
    ["stories", "故事", "Stories", "KiraMyao Equal 收录的个人故事与记忆卡。", "Personal stories and memory cards from KiraMyao Equal."],
    ["blog", "猫洞", "Cat Cave", "KiraMyao Equal 的文章、随笔与社群记录。", "KiraMyao Equal posts, reflections, and community notes."],
    ["documents", "资料", "Documents", "KiraMyao Equal 整理的参考资料。", "Reference documents and materials from KiraMyao Equal."],
    ["report", "报告", "Reports", "KiraMyao Equal 整理和发布的报告内容。", "KiraMyao Equal reports and research materials."],
  ];
  const prefix = "ai";
  await write(`${prefix}/index.md`, indexMarkdown(homepageCards, compiledArticles, actions, "zh"));
  await write(`${prefix}/about.md`, aboutKiraMarkdown(about, "zh"));
  await write(`${prefix}/action.md`, actionMarkdown(actions, "zh"));
  for (const [type, zhTitle, , zhDescription] of listSpecs) {
    const section = type === "blog" ? "cat-cave" : type;
    await write(
      `${prefix}/${section}.md`,
      articleListMarkdown(
        type,
        zhTitle,
        zhDescription,
        compiledArticles,
        "zh",
      ),
    );
  }
  await write(`${prefix}/join.md`, joinMarkdown(join, joinLinks, "zh"));
  await write(`${prefix}/privacy.md`, privacyMarkdown(privacy, "zh"));
  await write(
    `${prefix}/search-index.json`,
    JSON.stringify(articleSearchIndex(compiledArticles, "zh", now), null, 2),
  );

  for (const article of compiledArticles) {
    const sourceMarkdown = await sourceMarkdownFor(article);
    await write(
      markdownRouteForArticle(article, "zh").replace(/^\//, ""),
      await articleMarkdown(article, { locale: "zh", sourceMarkdown }),
    );
  }

  return {
    zhResources: zhCatalog.resources.length,
  };
}


async function main() {
  const [compiledArticles, about, join, joinLinks, privacy, actions, homepageCards] =
    await Promise.all([
      readJson("src/data/compiled_articles.json"),
      readJson("src/data/about.json"),
      readJson("src/data/join.json"),
      readJson("src/data/join_links.json"),
      readJson("src/data/privacy.json"),
      readJson("src/data/actions.json"),
      readJson("src/data/homepage_bento.json"),
    ]);
  const result = await generateAgentAssets({
    outputDir: publicDir,
    compiledArticles,
    about,
    join,
    joinLinks,
    privacy,
    actions,
    homepageCards,
  });
  console.log(
    `Generated agent assets: ${result.zhResources} zh resources.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
