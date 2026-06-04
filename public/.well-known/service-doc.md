# KiraMyao Equal Agent Service Document

KiraMyao Equal 关注中国跨性别与性别多元群体的生存处境、社群故事、资料整理和公共倡议，发布调查、报告、文章与参与方式。

## Discovery

- API catalog: https://kiraequal.org/.well-known/api-catalog
- Agent card: https://kiraequal.org/.well-known/agent-card.json
- Markdown index: https://kiraequal.org/llms.txt
- Content signal: `ai-train=no, search=yes, ai-input=yes`

## Markdown negotiation

Agents can request Markdown with `Accept: text/markdown`. On Cloudflare Pages, the generated `_worker.js` maps supported HTML URLs to their Markdown equivalents under `/ai/` and returns `Content-Type: text/markdown; charset=utf-8` with `x-markdown-tokens`.

## Resources

- [KiraMyao Equal](https://kiraequal.org/) ([Markdown](/ai/index.md))
- [关于我们](https://kiraequal.org/about) ([Markdown](/ai/about.md))
- [About KiraMyao](https://kiraequal.org/about-kiramyao) ([Markdown](/ai/about-kiramyao.md))
- [行动](https://kiraequal.org/action) ([Markdown](/ai/action.md))
- [加入我们](https://kiraequal.org/join) ([Markdown](/ai/join.md))
- [隐私与数据处理说明](https://kiraequal.org/privacy) ([Markdown](/ai/privacy.md))
- [一起完成《2026 中国跨性别者生存处境调查》](https://kiraequal.org/blog/2026-trans-survival-survey) ([Markdown](/ai/blog/2026-trans-survival-survey.md))
- [中国MTF生存指南：喵呜，一起在当下活下去](https://kiraequal.org/blog/Meow-lets-survive) ([Markdown](/ai/blog/Meow-lets-survive.md))
- [ios26.5 Pride壁纸](https://kiraequal.org/blog/ApplePride2026) ([Markdown](/ai/blog/ApplePride2026.md))
- [“带有精美插画和丝带的精装本”](https://kiraequal.org/story/blacknotebook) ([Markdown](/ai/story/blacknotebook.md))
- [“变成猫猫啦”一篇关于SRS的故事](https://kiraequal.org/story/Becoming-a-Cat-cat!) ([Markdown](/ai/story/Becoming-a-Cat-cat!.md))
- [KiraMyao Equal：中国跨性别者现状报告](https://kiraequal.org/report/KiraMyao_Equal__China_Trans) ([Markdown](/ai/report/KiraMyao_Equal__China_Trans.md))
- [中国跨性别医疗评估报告](https://kiraequal.org/report/China-Transgender-Healthcare-Report) ([Markdown](/ai/report/China-Transgender-Healthcare-Report.md))
- [联合国自由和平等：跨性别人群现状与挑战](https://kiraequal.org/report/article1) ([Markdown](/ai/report/article1.md))
