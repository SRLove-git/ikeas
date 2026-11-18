# 独立站拆分：medical-sg.com / home-sg.com / life-sg.com

2026-11-18 起，原 `life-sg.com` 单一商城拆分为三个域名，共用同一套后端、数据库与 OMS：

| 域名 | 定位 | 前端容器 | 商品范围 |
| --- | --- | --- | --- |
| `medical-sg.com` | 医疗健康站 | `buzud-frontend-medical` (3100) | `catalog.json` 中 `group = 医疗` 的全部商品（含家用健康设备） |
| `home-sg.com` | 家庭生活站 | `buzud-frontend-home` (3101) | 美的 / 东芝家电（`midea-*` / `toshiba-*`） |
| `life-sg.com` | 品牌门户 + 统一会员中心 | `buzud-frontend-portal` (3102) | 不展示商品目录，只保留两个站点入口与会员/订单/客服 |

后端仍是同一个 `buzud-server`（8181）+ PostgreSQL + OMS；三个域名的 `/api/v1/` 都由 nginx 反代到同一个后端。

## 1. 前端部署作用域

三份前端镜像由同一份代码构建，通过构建参数区分：

```dotenv
NEXT_PUBLIC_SITE_SCOPE=medical|home|portal
NEXT_PUBLIC_SITE_URL=https://medical-sg.com|https://home-sg.com|https://life-sg.com
NEXT_PUBLIC_API_BASE=<与 SITE_URL 相同的域名>
NEXT_PUBLIC_MEDICAL_URL=https://medical-sg.com
NEXT_PUBLIC_HOME_URL=https://home-sg.com
NEXT_PUBLIC_PORTAL_URL=https://life-sg.com
```

作用域规则集中在 `frontend/src/lib/site-scope.ts`：

- 商品归属：`id`/`slug` 以 `midea-` / `toshiba-` 开头 → 家庭站；其余 → 医疗站。
- 分类归属：菜单 `group = 医疗` → 医疗站；`group = 家电` → 家庭站；门户不展示目录。
- 未设置或未知 scope 时回退到 `medical`，保证旧镜像行为不变。
- 跨域移动统一使用 308（`permanentRedirect`），保留 SEO 权重。

### 路由矩阵

| 路由 | medical | home | portal |
| --- | --- | --- | --- |
| `/` | 医疗首页（过滤掉家电区块/入口） | 家电首页 | 品牌门户 |
| `/zh/all-products/` | 仅医疗分类 | 仅美的/东芝 | 两个站点入口 |
| `/zh/cat/<医疗分类>/` | 渲染 | 308 → 医疗站 | 308 → 医疗站 |
| `/zh/p/<医疗商品>/` | 渲染 | 308 → 医疗站 | 308 → 医疗站 |
| `/zh/p/<家电商品>/` | 308 → 家庭站 | 308 → 本站品牌详情 | 308 → 家庭站 |
| `/zh/toshiba/`、`/zh/midea/` | 308 → 家庭站 | 渲染 | 308 → 家庭站 |
| `/zh/profile/login/` | 307 → 门户登录 | 307 → 门户登录 | 登录表单 |

搜索、分类筛选、相关推荐、对比页、`sitemap.xml`、`robots.txt` 均按作用域过滤。

## 2. 统一会员与跨站 SSO

账号、会员等级、积分、余额、优惠券、订单、支付、库存全部在同一套后端/数据库中，不按站点拆分。

登录入口统一在门户：

1. 医疗站/家庭站点击登录 → 307 到
   `https://life-sg.com/zh/profile/login/?return=<当前站点绝对地址>`。
2. 门户完成登录/注册后调用 `POST /api/v1/auth/sso/code`（Bearer 认证），
   传入 `{"target":"medical"|"home"}`，获得 120 秒有效的一次性 code。
3. 浏览器跳转到目标站 `/zh/sso/?code=<code>&next=<目标站路径>`。
4. 目标站调用 `POST /api/v1/auth/sso/exchange`（公开接口）用 code 换取新的
   access token + refresh token，写入本站 `localStorage`，整页跳转到 `next`。

安全约束：

- code 只以 SHA-256 哈希落库，单次消费，120 秒过期；`target` 仅允许 `medical` / `home`。
- 门户只接受 `MEDICAL_URL` / `HOME_URL` 两个精确 origin 作为 `return`，避免开放重定向。
- 目标站 `next` 只接受以单个 `/` 开头的站内路径。
- 退出登录目前只清理当前站点令牌；门户会话仍保留（再次进入会重新 SSO）。

## 3. 订单渠道与支付

- 下单时前端传 `siteScope`，后端写入 `orders.sales_channel`（`medical` / `home`）。
  未传时按订单商品前缀推断；拆分前的历史订单为 `NULL`。
- `GET /api/v1/orders?channel=medical|home`：
  - 医疗站：`sales_channel = medical` 或 `NULL`（历史订单）
  - 家庭站：仅 `sales_channel = home`
  - 门户：不传 `channel`，聚合全部订单
- 支付仍使用同一 YeahPay/Stripe 商户配置；浏览器回跳地址按订单渠道生成：
  - medical → `https://medical-sg.com/zh/profile/my-orders?...`
  - home → `https://home-sg.com/zh/profile/my-orders?...`
  - `NULL` → 沿用 `IKEA_YEAHPAY_CALLBACK_URL` / `IKEA_STRIPE_RETURN_URL_BASE`
- 异步通知地址保持统一（`https://life-sg.com/api/v1/payment/.../webhook`），三个域名也都能反代 webhook。
- 购物袋、收藏、浏览历史是账号级共享数据，未按站点拆分。

## 4. DNS 与 HTTPS

需要在阿里云 DNS 配置：

| 记录 | 类型 | 值 |
| --- | --- | --- |
| `medical-sg.com` `@` | A | `47.84.25.19` |
| `medical-sg.com` `www` | A/CNAME | `47.84.25.19` / `medical-sg.com` |
| `home-sg.com` `@` | A | `47.84.25.19` |
| `home-sg.com` `www` | A/CNAME | `47.84.25.19` / `home-sg.com` |
| `life-sg.com` `@` / `www` | A | `47.84.25.19` |

证书由服务器上的 acme.sh 单独签发（standalone，HTTP-01 校验通过 web-gateway 的
`/.well-known/acme-challenge/` 转发到 8099）：

```bash
/root/.acme.sh/acme.sh --issue --standalone --httpport 8099 \
  -d medical-sg.com -d www.medical-sg.com --keylength ec-256 \
  --reloadcmd "/opt/diy/docker/nginx/reload-certs.sh"

/root/.acme.sh/acme.sh --issue --standalone --httpport 8099 \
  -d home-sg.com -d www.home-sg.com --keylength ec-256 \
  --reloadcmd "/opt/diy/docker/nginx/reload-certs.sh"
```

`reload-certs.sh` 的 `DOMAINS` 已加入 `home-sg.com`。证书落盘到
`/opt/diy/docker/nginx/certs/<domain>.pem|.key` 后重载 nginx。

## 5. 服务器部署

服务器代码目录：`/opt/buzud`，按 commit 建 git worktree 到
`/opt/buzud/releases/storefront-<sha>`，再复制上一版的 `deploy/.env`。

```bash
cd /opt/buzud/releases/storefront-<sha>
cp /opt/buzud/releases/storefront-<old>/deploy/.env deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml config -q
docker compose --env-file deploy/.env -f deploy/docker-compose.yml build app app-home app-portal buzud-server
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --no-deps buzud-server
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --no-deps app app-home app-portal
```

容器端口（绑定 `172.20.0.1`，由 nginx-lb 回源）：

- `app`（医疗）3100
- `app-home` 3101
- `app-portal` 3102
- `buzud-server` 8181

nginx 改动涉及两个容器：

1. `/opt/web-gateway/nginx.conf`（宿主 80）：三个域名的 HTTP → HTTPS 301 + ACME 校验转发。
2. `/opt/diy/docker/nginx/nginx.conf`（宿主 443）：
   - `life-sg.com` → `172.20.0.1:3102`
   - `medical-sg.com` → `172.20.0.1:3100`
   - `home-sg.com` → `172.20.0.1:3101`
   - `/api/v1/` → `172.20.0.1:8181`
   - `www.*` → 301 到各根域名

重载：

```bash
docker exec web-gateway nginx -t && docker exec web-gateway nginx -s reload
docker exec diy-nginx-lb nginx -t && docker exec diy-nginx-lb nginx -s reload
```

## 6. 环境变量

除原有变量外，新增：

```dotenv
# 支付回跳域名（后端）
BUZUD_SITE_MEDICAL_URL=https://medical-sg.com
BUZUD_SITE_HOME_URL=https://home-sg.com
BUZUD_SITE_PORTAL_URL=https://life-sg.com

# 允许跨域调用 API 的前台域名
CORS_ALLOWED_ORIGINS=https://medical-sg.com,https://www.medical-sg.com,https://home-sg.com,https://www.home-sg.com,https://life-sg.com,https://www.life-sg.com
```

前端构建参数由 `deploy/docker-compose.yml` 为三个 service 分别注入，无需写入 `.env`。

## 7. 数据库迁移

`backend/src/main/resources/db/migration/V27__site_channel_and_sso.sql`：

- `orders.sales_channel VARCHAR(16)` + `(sales_channel, created_at)` 索引
- `sso_code` 表（code_hash 唯一索引、user_id、target、expires_at、used）

后端容器启动时由 Flyway 自动执行。发布后检查：

```bash
docker exec buzud-postgres psql -U buzud -d buzud \
  -c "select version, description, success from flyway_schema_history order by installed_rank desc limit 3;" \
  -c "select count(*) from sso_code;" \
  -c "select sales_channel, count(*) from orders group by 1;"
```

## 8. 验收清单

- [ ] `https://medical-sg.com/` 首页无东芝/美的入口；`/zh/all-products/` 无家电分类
- [ ] `https://home-sg.com/` 首页无医疗商品；`/zh/all-products/` 仅 Midea/Toshiba
- [ ] `https://life-sg.com/` 门户两张入口卡片可跳转；`/zh/profile/` 可登录/查看订单
- [ ] 医疗站/家庭站点击登录 → 门户登录 → 登录一次后自动回到原站且已登录
- [ ] 医疗站下单 `sales_channel=medical`，家庭站下单 `sales_channel=home`
- [ ] 各站“我的订单”只显示本站订单 + 历史订单（医疗站）；门户显示全部
- [ ] YeahPay/Stripe 回跳回到下单站点；异步通知正常
- [ ] 三站 `/api/v1/health`、`/robots.txt`、`/sitemap.xml` 域名正确
- [ ] 旧 `life-sg.com` 商品/分类链接 308 到对应站点
- [ ] 三站证书包含 `www`，`www` 301 到根域名

## 9. 已知限制 / 后续

- 购物袋与收藏是账号级共享，未按站点隔离；在家庭站也能看到医疗商品购物袋。若要求严格隔离，需要给 `cart` 增加 channel 维度。
- 管理后台 `/admin/` 在三个域名都可访问（同一套管理员账号）；如需收敛，可在 nginx 只放行门户域名。
- `sso_code` 目前没有定期清理与按用户限流，上线后建议加定时任务与限流。
- `ikea.auth.login-enabled=false` 目前不会阻止 SSO exchange，需确认风控语义。
- OMS 订单回调暂未携带 `sales_channel`，如 OMS 需要分渠道报表需追加字段。

## 10. 本次上线记录（2026-11-18）

- 生产部署 commit：`bfc15b8b`（`/opt/buzud/DEPLOYED_COMMIT` 已更新）
- 三台前端容器：`buzud-frontend-medical` (3100)、`buzud-frontend-home` (3101)、`buzud-frontend-portal` (3102)，均为 healthy
- `buzud-server` 已重建，Flyway `V27 site channel and sso` 执行成功；`orders.sales_channel` 与 `sso_code` 已存在
- 已验收：三站首页、医疗站/家庭站目录与商品页、门户登录页/会员页、跨域 SSO code 签发与兑换、订单渠道参数、站点隔离 308 跳转、三站 sitemap/robots 域名
- 2026-11-18：`www.medical-sg.com` 已解析到 `47.84.25.19`，并已重签包含
  `medical-sg.com` + `www.medical-sg.com` 的证书；`https://www.medical-sg.com/` 返回
  301 → `https://medical-sg.com/`。
