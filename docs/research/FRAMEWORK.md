# ikea.cn 全站框架克隆说明

本项目以“框架优先”的方式复刻 ikea.cn:重点交付**路由结构、页面模板、样式与布局**,
内容使用已抓取的代表性真实数据作为样例。后续接入自己的后端时,只需替换数据层
(`src/data/`)即可,页面组件无需改动。

## 全站路由结构(对应原站 sitemap)

原站 sitemap(`https://www.ikea.cn/sitemaps/sitemap.xml`)共约 27,200 个唯一 URL,路由族如下:

| 路由族 | 原站 URL 数 | 克隆路由 | 模板 |
|---|---|---|---|
| 首页 | 1 | `/` | Home(完整首页克隆) |
| 商品详情 | 22,986 | `/cn/zh/p/[slug]` | ProductPage(商品画廊/价格/参数) |
| 分类/系列/合集 | 1,205 | `/cn/zh/cat/[slug]` | CategoryPage(商品网格 PLP) |
| 房间 | 1,101 | `/cn/zh/rooms/[slug]`、`/rooms/[...slug]`、`/rooms/[slug]/gallery` | ContentPage + 块渲染 |
| 家居灵感 | 895 | `/cn/zh/ideas/[slug]` | ContentPage |
| 新品 | 349 | `/cn/zh/new/[slug]` | ContentPage |
| 关于宜家 | 183 | `/cn/zh/this-is-ikea/...`(兜底) | ContentPage |
| 客户服务 | 134 | `/cn/zh/customer-service/...`(兜底 + services 子路由) | ContentPage |
| 活动与特惠 | 94 | `/cn/zh/campaigns/[slug]` | ContentPage |
| 对公业务 | 87 | `/cn/zh/ikea-business/...` | ContentPage |
| 门店 | 63 | `/cn/zh/stores/...`(兜底) | ContentPage |
| 设计工具 | 44 | `/cn/zh/planners/[slug]` | ContentPage |
| 新闻/产品指南/生活在家/特惠/俱乐部 | ~60 | `/cn/zh/[...slug]`(通用兜底) | ContentPage |

全站约 **4,000+ 个静态页面**由 `npm run build` 预渲染。

## 页面模板体系

1. **全局布局** `src/components/SiteLayout.tsx`
   - 头部(logo、搜索、账户/购物袋、一级菜单 + 全类目 Mega Menu)
   - 底部(会员卡片、链接分组、社交/版权)
   - 浮动组件(客服、返回顶部)
2. **首页模板** `src/app/page.tsx`
   轮播、必逛好物、服务列、热销榜、房间/可持续 pill slider、灵感瀑布流、服务保障、召回通知。
3. **内容页模板(CMS)** `src/components/ContentPage.tsx` + `ContentBlocks.tsx`
   面包屑 + 标题 + Hero + 通用块渲染器,支持 30+ 种原站块类型
   (pub-hero/pub-text/pub-image/pub-columns/pub-curated-gallery/pub-product-shelf/
   pub-quote/pub-expandable-area/pub-visual-pill-slider/pub-planner 等)。
4. **商品列表模板(PLP)** `src/app/cn/zh/cat/[slug]/page.tsx`
   面包屑、标题/描述、筛选 pill、商品网格。
5. **商品详情模板(PDP)** `src/app/cn/zh/p/[slug]/page.tsx`
   图片画廊、标签、名称/规格/价格、加入购物袋/收藏、特性、尺寸、材质、保养、描述。

## 数据层(后端接入点)

所有页面数据集中在 `src/data/`,页面组件只读数据,不写死内容:

| 数据文件 | 内容 | 对应模板 |
|---|---|---|
| `src/data/homepage.ts` | 首页各区块(轮播/热销/灵感等) | Home |
| `src/data/catalog.ts` | 商品目录样例(923 分类、~679 商品含详情) | PLP / PDP |
| `src/data/catalog-pages/all.json` | 全站 1,112 个分类/系列页(含商品摘要) | PLP(兜底) |
| `src/data/pages/*.json` | 2,333 个内容页(标题、Hero、块列表) | ContentPage |
| `src/data/pages-index.ts` | 合并所有内容页并提供 URL 索引 | 路由查找 |

后续接后端时,把 `src/data/` 下的静态数据替换为 API 返回(或保留文件、由构建时注入),
再按需把 `generateStaticParams` 改为动态渲染(`dynamicParams = true`)即可。

## 图片策略

按需求不批量下载图片:数据中保留原站 CDN URL(如 `file.app.ikea.cn`),页面通过
`src/components/SiteImage.tsx` 渲染——在线时加载真实图片,加载失败或缺失时自动显示
宜家风格占位图。需要本地化时,可将 URL 下载到 `public/images/` 并替换数据中的路径。

## 常用命令

- `npm run dev` — 本地开发
- `npm run build` — 全站预渲染构建
- `npm run lint` / `npm run typecheck` — 静态检查
- `node scripts/crawl-site.mjs --content` — 重新抓取内容页样本(不下载图片)
- `node scripts/crawl-site.mjs --products` — 全量抓取商品页(SSR,不下载图片)
- `node scripts/crawl-site.mjs --gaps` — 补抓 coverage 核对出的缺口
- `node scripts/check-coverage.mjs` — 用 sitemap 对比数据层,输出各路由族覆盖率
- `node scripts/classify-missing.mjs` / `node scripts/verify-product-gaps.mjs` — 区分原站死链与可抓缺口

## 已知边界

- 原站 sitemap 中约 13-15% 的商品 URL 已失效(返回“维护中”/404),克隆同样不收录;
  内容页缺口(约 400)也全部是原站死链或空壳页。
- 分类页中约 32 个 series/collection URL 在原站无任何商品数据,克隆按未收录处理。
- 交互性(搜索、购物袋、登录、规划工具)为前端演示占位,需后端接入。

## 覆盖率核对结果(2026-08-08)

对 sitemap 全部 27,200 个 URL 与克隆数据层逐条比对:

| 路由族 | sitemap | 已复刻 | 缺口 | 缺口性质 |
|---|---|---|---|---|
| 商品 p | 22,986 | ~19,900 | ~3,100 | 原站“维护中”死链 |
| 分类 cat | 1,205 | 1,163 | 42 | 32 个空壳页 + 10 个死链 |
| 内容页(CMS) | ~2,900 | ~2,500 | ~400 | 原站 404 死链 |
| 设计工具 | 44 | 30 | 14 | 重定向/死链 |

内容页与分类页的缺口经逐 URL 探测,全部是原站自身已失效的页面;
商品缺口经复核脚本分类为 dead(维护页)或 retryable(可补抓)。
- 交互性(搜索、购物袋、登录、规划工具)为前端演示占位,需后端接入。
