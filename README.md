# AI Website Cloner Template

<a href="https://github.com/JCodesMore/ai-website-cloner-template/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a> <a href="https://github.com/JCodesMore/ai-website-cloner-template/stargazers"><img src="https://img.shields.io/github/stars/JCodesMore/ai-website-cloner-template?style=flat" alt="Stars" /></a> <a href="https://discord.gg/hrTSX5yTpB"><img src="https://img.shields.io/discord/1400896964597383279?label=discord" alt="Discord" /></a> <img src="https://img.shields.io/endpoint?url=https://gittokens.rsamf.com/badge/JCodesMore/ai-website-cloner-template" alt="tokens" />

A reusable template for reverse-engineering any website into a clean, modern Next.js codebase using AI coding agents. 

**Recommended: [Claude Code](https://docs.anthropic.com/en/docs/claude-code) with Opus 4.8 for best results** — but works with a variety of AI coding agents.

Point it at a URL, run `/clone-website`, and your AI agent will inspect the site, extract design tokens and assets, write component specs, and dispatch parallel builders to reconstruct every section.

## Demo

[![Watch the demo](docs/design-references/comparison.png)](https://youtu.be/O669pVZ_qr0)

> Click the image above to watch the full demo on YouTube.

## Quick Start

> **Important:** Start by making your own copy with GitHub's **Use this template** button. Do not clone this template repository directly for your website project, and do not open pull requests here with your generated website.

1. **Create your own repository from this template**

   On the GitHub page for this project, click **Use this template**, then click **Create a new repository**.

   Give your new repository a name, choose whether it should be public or private, then click **Create repository**. If GitHub shows an **Include all branches** option, you can leave it off.

   This gives you your own separate project to work in, so your website changes stay in your account instead of coming back to the main template.

2. **Open your new repository on your computer**

   After GitHub creates your copy, open that new repository. Click **Code** and open or clone your new repository with your preferred coding tool.

   If you use the terminal, the command will look like this:

   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-NEW-REPOSITORY.git
   cd YOUR-NEW-REPOSITORY
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Start your AI agent** — Claude Code recommended:
   ```bash
   claude --chrome
   ```
5. **Run the skill**:
   ```
   /clone-website <target-url1> [<target-url2> ...]
   ```
6. **Customize** (optional) — after the base clone is built, modify as needed

> Using a different agent? Open `AGENTS.md` for project instructions — most agents pick it up automatically.

## Supported Platforms

| Agent                                                         | Status                     |
| ------------------------------------------------------------- | -------------------------- |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | **Recommended** — Opus 4.8 |
| [Codex CLI](https://github.com/openai/codex)                  | Supported                  |
| [OpenCode](https://opencode.ai/)                              | Supported                  |
| [GitHub Copilot](https://github.com/features/copilot)         | Supported                  |
| [Cursor](https://cursor.com/)                                 | Supported                  |
| [Windsurf](https://codeium.com/windsurf)                      | Supported                  |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli)     | Supported                  |
| [Cline](https://github.com/cline/cline)                       | Supported                  |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code)            | Supported                  |
| [Continue](https://continue.dev/)                             | Supported                  |
| [Amazon Q](https://aws.amazon.com/q/developer/)               | Supported                  |
| [Augment Code](https://www.augmentcode.com/)                  | Supported                  |
| [Aider](https://aider.chat/)                                  | Supported                  |

## Prerequisites

- [Node.js](https://nodejs.org/) 24+
- An AI coding agent (see [Supported Platforms](#supported-platforms))

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript strict
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **Lucide React** — default icons (replaced by extracted SVGs during cloning)

## Backend (`server/`)

The `server/` folder contains a **Java 21 + Spring Boot 3.5** REST backend that
serves the same crawled data (categories, products, content pages, homepage,
menus) through a JSON API, implements the site's interactive features
(SMS/password login with bearer sessions, shopping bag, favorites, customer
chat), and can optionally serve the `public/` assets. The frontend login page,
search page, header account state, product page actions and chat widget are
wired to this API (fall back to static data when the backend is unreachable).

Demo account: `demo@ikea.cn` / `13800138000`, password `123456`.

```bash
cd server && ./mvnw spring-boot:run   # http://localhost:8080/api/v1/health
```

See [server/README.md](server/README.md) for the API reference and
configuration. Data is exported from `src/data/` via
`node scripts/export-server-data.mjs`.

## How It Works

The `/clone-website` skill runs a multi-phase pipeline:

1. **Reconnaissance** — screenshots, design token extraction, interaction sweep (scroll, click, hover, responsive)
2. **Foundation** — updates fonts, colors, globals, downloads all assets
3. **Component Specs** — writes detailed spec files (`docs/research/components/`) with exact computed CSS values, states, behaviors, and content
4. **Parallel Build** — dispatches builder agents in git worktrees, one per section/component
5. **Assembly & QA** — merges worktrees, wires up the page, runs visual diff against the original

Each builder agent receives the full component specification inline — exact `getComputedStyle()` values, interaction models, multi-state content, responsive breakpoints, and asset paths. No guessing.

## Use Cases

- **Platform migration** — rebuild a site you own from WordPress/Webflow/Squarespace into a modern Next.js codebase
- **Lost source code** — your site is live but the repo is gone, the developer left, or the stack is legacy. Get the code back in a modern format
- **Learning** — deconstruct how production sites achieve specific layouts, animations, and responsive behavior by working with real code

## Not Intended For

- **Phishing or impersonation** — this project must not be used for deceptive purposes, impersonation, or any activity that breaks the law.
- **Passing off someone's design as your own** — logos, brand assets, and original copy belong to their owners.
- **Violating terms of service** — some sites explicitly prohibit scraping or reproduction. Check first.

## Project Structure

```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons
  lib/utils.ts      # cn() utility
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target
  videos/           # Downloaded videos from target
  seo/              # Favicons, OG images
docs/
  research/         # Extraction output & component specs
  design-references/ # Screenshots
scripts/
  sync-agent-rules.sh  # Regenerate agent instruction files
  sync-skills.mjs      # Regenerate /clone-website for all platforms
AGENTS.md           # Agent instructions (single source of truth)
CLAUDE.md           # Claude Code config (imports AGENTS.md)
GEMINI.md           # Gemini CLI config (imports AGENTS.md)
```

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint check
npm run typecheck # TypeScript check
npm run check  # Run lint + typecheck + build
```

### If using docker

```bash
docker compose up app --build # build and run the app
docker compose up dev --build # run the app in dev mode on port 3001
```

## 内容管理后台（Admin CMS）

本项目内置一个完整的内容管理后台，可以管理网站的全部内容：

- **入口**：`http://localhost:3000/admin/login`（开发端口 3200 时用 `http://localhost:3200/admin/login`）
- **默认账号**：`admin / admin123`（可用环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 修改）

后台管理的内容：

| 模块 | 说明 |
| --- | --- |
| 仪表盘 | 内容统计、运营服务状态、最近操作 |
| 商品管理 | 商品的名称/价格/图片/标签/详情，支持搜索、新建、编辑、删除 |
| 分类管理 | 商品分类与频道分类的名称、链接、图片、子分类 |
| 页面内容 | 全部内容页面（房间/灵感/活动/客服/门店/新闻等）+ 41 个兜底页面，区块化编辑器 |
| 首页管理 | 顶部通知、导航、Hero 轮播、促销、榜单、页脚等全部区块 |
| 导航菜单 | 顶部下拉菜单面板与「所有商品」分类菜单 |
| 分类落地页 | 分类页的名称、描述、推荐商品与内容区块 |
| 订单管理 | 「我的订单」页面数据源，支持新建/编辑/删除 |
| 客服知识库 | 客服机器人自动回复规则与默认回复（热更新，`IKEA_CHAT_KNOWLEDGE_FILE`） |
| 用户/购物车/收藏/聊天 | 对接 Spring Boot 运营服务（需后端在线，管理密钥 `IKEA_ADMIN_KEY`，默认 `ikea-admin`） |
| 网站设置 | 站点名称、SEO 描述与 404/问卷页面文案（实时生效） |
| 操作日志 | 后台所有内容修改记录（保留 200 条） |

**数据即文件**：后台读写 `src/data/*.json`（商品、页面、首页、菜单、订单、设置等），
前台页面每次请求实时读取同一份文件。后台保存后前台立即生效，无需重启或重新构建；
生产部署时 `next build` 会把 `src/data` 一并打进 standalone 输出。

**同步到后端**：内容修改后，运行 `node scripts/export-server-data.mjs` 会把最新
`src/data` 导出到 `server/src/main/resources/data`，让 Spring Boot API 返回一致数据。

管理后台 API 位于 `/api/admin/**`（Next.js Route Handlers，会话 Cookie 认证）；
运营数据接口位于 Spring Boot `/api/v1/admin/**`（`X-Admin-Key` 认证）。

## Updating for Other Platforms

Two source-of-truth files power all platform support. Edit the source, then run the sync script:

| What                   | Source of truth                         | Sync command                       |
| ---------------------- | --------------------------------------- | ---------------------------------- |
| Project instructions   | `AGENTS.md`                             | `bash scripts/sync-agent-rules.sh` |
| `/clone-website` skill | `.claude/skills/clone-website/SKILL.md` | `node scripts/sync-skills.mjs`     |

Each script regenerates the platform-specific copies automatically. Agents that read the source files natively need no regeneration.


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=JCodesMore/ai-website-cloner-template&type=Date)](https://star-history.com/#JCodesMore/ai-website-cloner-template&Date)

## License

MIT
