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

const SECTION_11 = `### 26.11 用一句话说明这些内容

* **我们能看到什么。** 你的用药记录和化验结果加密保存，静态时我们不持有解密密钥，因此数据库被窃取也不会暴露记录内容。
* **我们什么时候能读取。** 你登录后，密钥会在服务器内存中保留，最长为你连续三十分钟没有操作，以便服务读取和更新你的记录。这段时间内我们可以读取你的记录；超时或你主动退出后，密钥即被丢弃，我们无法再读取。
* **这不是端到端加密。** 你的浏览器与服务器之间使用 HTTPS 传输，服务器在你解锁期间会解密。我们不是声称我们从未看到你的数据，而是声称在你离开的时候我们不持有密钥。
* **密码是唯一无法挽回的东西。** 记录的解密密钥由你的密码派生，我们只保存一个无法还原出密钥的哈希。密码丢失，记录就无法恢复，你也好、我们也罢，都无法挽回。恢复码保护的是你的登录，不是你的数据，它解不开任何记录。两样都请放在不会丢的地方。
* **助手与令牌。** 你可以把访问令牌粘贴给 AI 助手来连接它。令牌只在你处于登录状态时有效，也无法单独解开你的账户。请把它当作密码：在你登录期间，泄露的令牌可以读取你的记录并让会话一直保持有效。在设置中吊销即可终止。记录一旦到达助手提供方，就由其政策约束，我们无法替你在那边删除。
* **删除账户**会立即且完整地移除你的记录、化验结果、设置、恢复码、令牌和已关联的登录方式。会保留一条不含任何标识信息的计数记录。你单独删除的记录会被标记为已删除并隐藏，但仍会保存到你删除账户为止。

本节之前的 26.1 至 26.10 是逐项说明；如果你只想了解大致情况，读这一节即可。`;

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

// Splice 26.3 in place, then 26.11 (its start shifts by the length delta of change 1,
// so recompute against the new string rather than reusing offsets).
const withNewThree =
  md.slice(0, i3) + SECTION_3 + "\r\n\r\n" + md.slice(i4).replace(/^/, "");

const i11New = withNewThree.indexOf("### 26.11 本节依据的实现");
if (i11New < 0) throw new Error("26.11 lost after first splice");

const updatedMd = withNewThree.slice(0, i11New) + SECTION_11;
// Preserve the file's trailing newline convention.
data.content_markdown = updatedMd.endsWith("\n") ? updatedMd : updatedMd + "\r\n";

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

// 26.11 runs to the end of the document.
replaceRange(h11, null, SECTION_11);
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
  for (const claim of [
    "远端", // placeholder check no
  ]) void claim;
  if (!body.includes("延长")) throw new Error(`${label}: missing session-extension fact`);
  if (!body.includes("吊销")) throw new Error(`${label}: missing revocation`);
  if (!body.includes("远程访问")) throw new Error(`${label}: missing remote-access denial`);
  if (!body.includes("端到端")) throw new Error(`${label}: missing E2EE denial`);
  if (body.includes("server/src/") || body.includes("server/schema")) {
    throw new Error(`${label}: internal file path still present`);
  }
}
if (!data.content_markdown.includes("不是同一个意思")) {
  throw new Error("markdown: missing the 'not the same claim' paragraph");
}

writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("privacy.json updated");
console.log("  markdown", data.content_markdown.length, "chars");
console.log("  html     ", data.content_html.length, "chars");
