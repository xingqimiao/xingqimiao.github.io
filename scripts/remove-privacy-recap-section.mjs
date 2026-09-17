// Removes the recap section (26.11) from the published privacy policy. It restated the
// document as a summary, which is not what a privacy policy is for — the per-topic
// sections above it already say everything, and a second voice saying it again is how
// the two drift apart.
//
// Kept separate from update-privacy-kiramyao.mjs because that script runs against the
// pre-rewrite document and its anchors no longer exist.
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";

const file = new URL("../src/data/privacy.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));

const HEADING = "### 26.11";
const i = data.content_markdown.indexOf(HEADING);
if (i < 0) throw new Error("26.11 not found in content_markdown");
if (data.content_markdown.indexOf(HEADING, i + 1) !== -1) {
  throw new Error("26.11 appears more than once");
}

// 26.11 is the last section, so everything from its heading on goes. Nothing follows it
// and nothing references it, so no renumbering is needed.
data.content_markdown = data.content_markdown
  .slice(0, i)
  .replace(/\s*$/, "")
  .concat("\r\n");

const root = parse(data.content_html);
const heading = root
  .querySelectorAll("h3")
  .find((h) => typeof h.text === "string" && h.text.trim().startsWith("26.11"));
if (!heading) throw new Error("26.11 heading not found in content_html");

// node-html-parser's nextSibling chain is unusable here: between block elements it
// inserts newline TextNodes, and a TextNode's own nextSibling is null, so a naive walk
// stops on the first one and removes nothing. Go through the parent's child list instead.
const parent = heading.parentNode;
const kids = [...parent.childNodes];
const at = kids.indexOf(heading);
if (at < 0) throw new Error("26.11 heading is not in the tree");
const doomed = kids.slice(at);
for (const n of doomed) n.remove();

data.content_html = root
  .toString()
  .replace(/<\/strong>(?=<a\s)/g, "</strong> ")
  .replace(/<\/li>(?=<\/(ul|ol)>)/g, "</li>\n")
  .replace(/<(ul|ol)>(?=<li>)/g, "<$1>\n")
  .replace(
    /<\/(p|ul|ol|li|h2|h3|h4|h5|h6|div)>(?=<(p|ul|ol|li|h2|h3|h4|h5|h6|div)>)/g,
    "</$1>\n",
  );

for (const [label, body] of [
  ["markdown", data.content_markdown],
  ["html", data.content_html],
]) {
  if (body.includes("26.11")) throw new Error(`${label}: 26.11 still present`);
  if (body.includes("用一句话说明")) throw new Error(`${label}: recap text still present`);
  if (!body.includes("26.10")) throw new Error(`${label}: 26.10 was lost`);
  if (!body.includes("连接助手不等于给了它远程访问权限")) {
    throw new Error(`${label}: 26.3 rewrite was lost`);
  }
  if (/server\/(src|schema|test)/.test(body)) {
    throw new Error(`${label}: internal file path reintroduced`);
  }
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("26.11 removed");
console.log("  markdown", data.content_markdown.length, "chars");
console.log("  html     ", data.content_html.length, "chars");
