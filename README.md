# KiraMyao Equal · 跨性别研究与故事集

关注中国跨性别与性别多元群体生存处境、真实故事、资料整理和公共倡议的独立公益项目。

- **正式站点**：<https://kiramyao.com>
- **技术栈**：Next.js（App Router，静态导出）· TypeScript · Tailwind CSS · GSAP
- **托管**：Cloudflare Pages（静态导出 `out/`），GitHub 作为源码仓库

## 本地开发

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm test           # vitest 全量测试
npm run lint       # ESLint
npm run build      # content:compile → generate-agent-assets → next build → clean-export
```

## 内容管线

所有文章与故事以 Markdown 存放，构建时编译为单个 JSON 数据源：

```text
content/{stories,blog,report,documents}/*.md
        │  frontmatter: title / slug / year / cover / seoDescription / keywords …
        ▼
scripts/compile-articles.mjs
        ▼
src/data/compiled_articles.json   →  页面在构建时静态渲染
```

新增一篇故事：在 `content/stories/` 放 Markdown，运行 `npm run content:compile`
后重新构建即可。故事按年份排序，可通过 `year` frontmatter 控制。

## 目录结构（要点）

| 路径 | 说明 |
|---|---|
| `src/app/(zh)/*` | 页面路由（中文单语言） |
| `src/app/*/` | 各页面的客户端组件 |
| `src/lib/` | 元数据、JSON-LD、文章/列表展示、搜索等纯函数 |
| `content/` | Markdown 文章与故事源 |
| `src/data/` | 编译产物与站点配置（`compiled_articles.json`、`join.json`、`privacy.json` 等） |
| `public/` | 静态资源；`public/ai/*.md` 为 AI 可读的 Markdown 镜像 |
| `scripts/` | 编译、生成、迁移、部署辅助脚本 |

## 部署（Cloudflare Pages）

```text
push 到分支 cloudflare-pages-source  →  Cloudflare Pages 自动构建上线
```

构建设置在 Cloudflare Dashboard：`Build command: npm run build`，
`Build output directory: out`，`NODE_VERSION=22`。详见 `CLOUDFLARE_PAGES.md`。

## SEO / AI 可发现性

站点自动生成并维护：

- `sitemap.xml`（含全部文章与页面）、`robots.txt`（带 Content-Signal）
- `llms.txt`、`.well-known/api-catalog`、`.well-known/service-doc.md`
- `public/ai/*.md` Markdown 镜像，经 `out/_worker.js` 按 `Accept: text/markdown` 协商返回
- 每篇文章/列表/页面注入 JSON-LD 结构化数据（Article / CollectionPage / WebPage 等）
- `npm run indexnow` 向 Bing 推送全量 URL

## 本地预览构建产物

```bash
npm run build && node scripts/preview-static.mjs out
# 打开 http://127.0.0.1:8790
```

仅供本地预览，改动无需重新部署。

## 脚本速查

| 命令 | 作用 |
|---|---|
| `npm run content:compile` | 编译 content/ → compiled_articles.json |
| `npm run indexnow` | 推送 IndexNow |
| `npm run pages:verify` | 校验 Cloudflare Pages 产物 |
| `npm run pages:deploy` | build + verify + wrangler 直接部署 |
| `npm run images:migrate:*` 等 | 历史数据迁移工具（见 package.json） |

---

KiraMyao Equal 为独立运营的公益项目，不从事或宣传危害公共安全、暴力、恐怖主义、反人类及其他违法行为。如需投稿或联系我们，请访问 <https://kiramyao.com/join>。
