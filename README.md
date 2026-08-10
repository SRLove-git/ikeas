# BUZUD 健康产品商城

基于 Next.js 16 + Spring Boot 3.5 的 BUZUD 品牌健康产品商城。当前商品目录为零售价清单中的 23 个家庭健康自测与监测产品（快速检测试剂、智能手表、血压计、血糖管理、健康监测设备），价格以 SGD 显示。

## 功能

- 前台：首页、所有商品、5 个商品分类页、商品详情、搜索、购物袋、收藏、订单、个人中心、结算、客户服务内容页
- 管理后台（`/admin`）：首页各区块、分类、导航菜单、商品、落地页、订单、客服知识库，均支持表单化编辑，保存后前台即时生效
- 后端 API：商品/目录/首页/菜单/内容页、登录（短信/密码）、购物袋、收藏、客服聊天

## 技术栈

- 前端：Next.js 16（App Router、React 19、TypeScript strict、Tailwind CSS v4、shadcn/ui），位于 `frontend/`
- 后端：Java 21 + Spring Boot 3.5（`backend/`，端口 8080）
- 数据：JSON 文件（无数据库），前端 `frontend/src/data/` 为唯一编辑入口，后端为同步副本

## 目录结构

```
frontend/
  src/
    app/            # 前台路由 + /admin 管理后台 + /api 接口
    components/     # 页面组件（admin/ 为后台组件）
    data/           # 数据源：products、catalog、catalog-pages、homepage、menu、pages
    lib/            # 数据读取、API、管理后台存储
  public/images/products/         # BUZUD 商品图片
backend/src/main/resources/data/  # 后端数据副本（由导出脚本同步）
deploy/                           # Docker 与 docker-compose 配置
scripts/
  import-buzud-products.py  # 从零售价 PDF 导入商品
  update-buzud-menu.py      # 生成 BUZUD 导航菜单
  export-server-data.mjs    # 前端数据 -> 后端数据
docs/项目规范.md              # 项目开发与内容规范（必读）
```

## 本地运行

```bash
# 前端（Node >= 24）
cd frontend
npm install
npm run dev          # http://localhost:3000

# 后端（JDK 21，macOS 需设置 JAVA_HOME）
cd backend && ./mvnw spring-boot:run  # http://localhost:8080
```

演示账号：`demo@buzud.com` / `13800138000`，密码 `123456`。
管理后台：http://localhost:3000/admin/ （默认 `admin / admin123`，可用环境变量覆盖）。

## 本地数据库（PostgreSQL）

后端已接入 PostgreSQL + MyBatis-Plus + Flyway（企业级改造第一批 1.1）。本地用 Docker 启动：

```bash
docker compose -f deploy/docker-compose.yml up -d db   # PostgreSQL 16，端口 5432
```

默认连接参数（可用环境变量覆盖）：`DB_HOST=localhost`、`DB_PORT=5432`、`DB_NAME=buzud`、`DB_USER=buzud`、`DB_PASSWORD=buzud`。后端启动时 Flyway 自动执行 `backend/src/main/resources/db/migration/` 下的迁移脚本。

## 常用命令

```bash
cd frontend
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run lint         # ESLint
npm run typecheck    # TypeScript 检查
npm run format       # Prettier 自动格式化
npm run format:check # Prettier 检查
npm run check        # lint + typecheck + build
```

数据变更后同步后端：

```bash
node scripts/export-server-data.mjs
# 重启后端服务使其生效
```

## 商品导入

更新商品目录时执行：

```bash
python3 scripts/import-buzud-products.py    # 从 PDF 导入商品与图片
python3 scripts/update-buzud-menu.py        # 重新生成导航菜单
node scripts/export-server-data.mjs         # 同步后端
```

详细规范（数据字段约定、分类体系、管理后台、Git 流程、验证清单等）见 [docs/项目规范.md](docs/项目规范.md)。
