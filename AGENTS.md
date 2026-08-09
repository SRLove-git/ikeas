<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BUZUD 商城项目说明

本项目是 BUZUD 健康产品商城（Monorepo：`frontend/` Next.js 16 + `backend/` Spring Boot 3.5）。开发前请阅读 [docs/项目规范.md](docs/项目规范.md)，遵守其中的数据架构、内容管理、代码风格与 Git 约定。

要点：

- 商品目录只保留 23 个 BUZUD 商品，价格单位为 SGD；禁止混入原模板的 IKEA 商品数据。
- 数据文件：`frontend/src/data/` 为唯一编辑入口，后端 `backend/src/main/resources/data/` 通过 `node scripts/export-server-data.mjs` 同步，数据变更后需重启后端。
- 前端命令在 `frontend/` 目录下执行，后端命令在 `backend/` 目录下执行。
- 管理后台 `/admin/` 已全部表单化，默认账号 `admin / admin123`。
- 提交前运行 `npm run typecheck && npm run lint && npm run build`。
