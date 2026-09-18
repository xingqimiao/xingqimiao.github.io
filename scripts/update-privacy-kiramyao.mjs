// One-off: rewrite the Kira Tracker sections of the published privacy policy so they
// match the guide in the HRT repository (server/PRIVACY-POLICY-GUIDE.md §3 and the
// closing section). Keeps content_markdown and content_html in step, since the page
// renders the HTML and the /ai/privacy.md asset is built from the Markdown.
import { readFileSync, writeFileSync } from "node:fs";
import { parse, HTMLElement } from "node-html-parser";

const file = new URL("../src/data/privacy.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));

const OLD_3_START = "### 26.3 连接 AI 助手";
const OLD_4_START = "### 26.4 收集范围与用途";

const SECTION_3 = `### 26.3 连接 AI 助手

Kira Tracker 支持通过 MCP 协议把你自行选择的 AI 助手连接到账户。如果你这样做，你通过助手访问的记录会被发送给该 AI 服务提供方，并以明文形式按该提供方的条款和隐私政策处理。我们无法控制其后续使用，也无法替你在那边删除这些数据。

连接助手不等于给了它远程访问权限。连接本身不会让你的账户可以被远程打开：解密密钥只会在你用密码解锁之后存在于服务器内存中。如果你的会话已经过期，助手会被告知账户处于锁定状态，你需要先在这里解锁一次。

关于访问令牌，有三点需要说清楚：

* **令牌本身解不开你的账户。** 它只证明身份，不携带任何解密密钥。
* **但令牌是长期有效的，请把它当作密码对待。** 在你已经登录的期间，一个泄露的令牌可以读取你的记录，而且每次读取都会延长这个会话，因此持有令牌的人在登录状态下可以让这个窗口一直保持打开。
* **随时可以在设置中吊销令牌**，吊销后立即生效。

「需要先解锁」和「令牌无害」不是同一个意思。上一条里的两个事实方向相反：令牌自己创造不出访问权限，但只要你已经登录，它就能一直读下去。只说前一半，会让人以为令牌泄露无所谓，而实际情况不是这样。

是否连接助手由你决定。数据一旦离开本服务，我们就无法撤回。`;


const md = data.content_markdown;
const i3 = md.indexOf(OLD_3_START);
const i4 = md.indexOf(OLD_4_START);
const i11 = md.indexOf("### 26.11 本节依据的实现");

if (i3 < 0 || i4 < 0 || i11 < 0) {
  throw new Error(`section anchors not found: 26.3=${i3} 26.4=${i4} 26.11=${i11}`);
}
if (!(i3 < i4 && i4 < i11)) {
  throw new Error("section anchors out of order");
}

// 26.3 is rewritten in place; 26.11 (the audit table) is dropped entirely — a section
// that restates the document in summary is not a thing a privacy policy does. It is
// the last section, so nothing needs renumbering.
const withNewThree =
  md.slice(0, i3) + SECTION_3 + "\r\n\r\n" + md.slice(i4);

const i11New = withNewThree.indexOf("### 26.11 本节依据的实现");
if (i11New < 0) throw new Error("26.11 lost after first splice");

data.content_markdown = withNewThree.slice(0, i11New).replace(/\s*$/, "\r\n");

// --- HTML -------------------------------------------------------------------
// The page renders content_html, so it has to carry the same text. Rebuild only the
// two replaced sections rather than converting the whole document, which would churn
// the rest of the markup for no reason.
const root = parse(data.content_html);
const headings = root.querySelectorAll("h3");
const headingText = (node) =>
  node && typeof node.text === "string" ? node.text.trim() : "";
const isHeading = (node) =>
  node && node.nodeType === 1 && /^h[1-6]$/i.test(node.rawTagName || "");
const findHeading = (text) => headings.find((h) => headingText(h).startsWith(text));
const h3 = findHeading("26.3");
const h4 = findHeading("26.4");
const h11 = findHeading("26.11");
if (!h3 || !h4 || !h11) throw new Error("html anchors not found");

// The rendered markup interleaves whitespace TextNodes between blocks, and a TextNode
// has no remove()/nextSibling chain we can rely on. Drop them once, up front, so the
// walk below only ever sees element nodes.
const walkRoot = root.querySelector("body") || root;
const stripWhitespace = (node) => {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) {
      if (!child.text.trim()) child.remove();
      continue;
    }
    if (child.nodeType === 1 && child.childNodes && child.childNodes.length) {
      stripWhitespace(child);
    }
  }
};
stripWhitespace(walkRoot);

const htmlFor = (markdown) => {
  const blocks = markdown.split(/\r?\n\r?\n/).filter((b) => b.trim());
  return blocks
    .map((block) => {
      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines[0].startsWith("### ")) {
        return `<h3>${escapeHtml(lines[0].slice(4))}</h3>`;
      }
      if (lines.every((l) => l.startsWith("* "))) {
        const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .join("\n");
};

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Only bold markup is used inside these sections; escaping first keeps it safe.
function inline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

const collect = (startHeading, stopHeading) => {
  const out = [];
  for (let n = startHeading.nextSibling; n && n !== stopHeading; n = n.nextSibling) {
    if (!isHeading(n) && n.nodeType === 1) out.push(n);
  }
  return out;
};

// Replaces the blocks under startHeading (up to stopHeading, or to the end) with the
// rendered form of `markdown`, leaving the heading itself to be dropped as well.
const replaceRange = (startHeading, stopHeading, markdown) => {
  const doomed = collect(startHeading, stopHeading);
  startHeading.insertAdjacentHTML("beforebegin", htmlFor(markdown));
  startHeading.remove();
  doomed.forEach((n) => n.remove());
};

// Removes a heading and every element after it, for a section that runs to EOF.
const removeToEnd = (startHeading) => {
  const doomed = collect(startHeading, null);
  startHeading.remove();
  doomed.forEach((n) => n.remove());
};

// 26.11 runs to the end of the document and is removed rather than replaced.
removeToEnd(h11);
replaceRange(findHeading("26.3"), findHeading("26.4"), SECTION_3);

data.content_html = root.toString();

// node-html-parser normalises whitespace and drops the blank lines between blocks when
// it re-serialises. Restore the two things that were real content: the space between an
// element and its following text sibling ("联系邮箱：" + mailto link), and the newline
// between block-level tags, so the diff stays limited to the two sections edited above.
data.content_html = data.content_html
  .replace(/<\/strong>(?=<a\s)/g, "</strong> ")
  .replace(/<\/li>(?=<\/(ul|ol)>)/g, "</li>\n")
  .replace(/<(ul|ol)>(?=<li>)/g, "<$1>\n")
  .replace(/<\/(p|ul|ol|li|h2|h3|h4|h5|h6|div)>(?=<(p|ul|ol|li|h2|h3|h4|h5|h6|div)>)/g, "</$1>\n");

// --- assertions -------------------------------------------------------------
const paths = [
  ...data.content_markdown.matchAll(/`[^`]*\.(ts|tsx|sql|mjs|js)`/g),
  ...data.content_html.matchAll(/`[^`]*\.(ts|tsx|sql|mjs|js)`/g),
];
if (paths.length) throw new Error(`file paths remain: ${paths.map((m) => m[0])}`);

for (const [label, body] of [
  ["markdown", data.content_markdown],
  ["html", data.content_html],
]) {
  if (!body.includes("延长")) throw new Error(`${label}: missing session-extension fact`);
  if (!body.includes("吊销")) throw new Error(`${label}: missing revocation`);
  if (!body.includes("远程访问")) throw new Error(`${label}: missing remote-access denial`);
  if (body.includes("server/src/") || body.includes("server/schema")) {
    throw new Error(`${label}: internal file path still present`);
  }
  if (body.includes("26.11") || body.includes("本节依据的实现")) {
    throw new Error(`${label}: the removed audit/recap section is still present`);
  }
}
if (!data.content_markdown.includes("不是同一个意思")) {
  throw new Error("markdown: missing the 'not the same claim' paragraph");
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("privacy.json updated");
console.log("  markdown", data.content_markdown.length, "chars");
console.log("  html     ", data.content_html.length, "chars");
