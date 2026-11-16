# life-sg.com 域名切换清单

`life-sg.com` 作为新的主站域名，`www.life-sg.com` 只做 301 跳转到根域名。

## DNS 与 HTTPS

1. 先在服务器网关中配置 `life-sg.com` 和 `www.life-sg.com` 虚拟主机，上游保持前端 `127.0.0.1:3000` 与后端 `127.0.0.1:8080`。
2. 申请覆盖 `life-sg.com` 和 `www.life-sg.com` 的 TLS 证书并开启 HTTP 到 HTTPS 跳转。
3. 在阿里云 DNS 添加：
   - `@  A  47.84.25.19`
   - `www  CNAME  life-sg.com`
4. 确认 `https://life-sg.com/api/v1/health` 和首页均返回 200 后再对外发布。

## 生产环境变量

```dotenv
NEXT_PUBLIC_API_BASE=https://life-sg.com
NEXT_PUBLIC_SITE_URL=https://life-sg.com
CORS_ALLOWED_ORIGINS=https://life-sg.com,https://www.life-sg.com

IKEA_YEAHPAY_CALLBACK_URL=https://life-sg.com/zh/profile/my-orders?payment=success
IKEA_YEAHPAY_NOTIFY_URL=https://life-sg.com/api/v1/payment/yeahpay/webhook
IKEA_STRIPE_RETURN_URL_BASE=https://life-sg.com

BUZUD_VOUCHER_BOOKING_URL=https://life-sg.com/zh/booking/
BUZUD_VOUCHER_POINTS_REDEEM_URL=https://life-sg.com/zh/profile/
BUZUD_MARKETING_PUBLIC_BASE_URL=https://life-sg.com
IKEA_MAIL_USERNAME=no-reply@mail.life-sg.com
IKEA_MAIL_FROM=CHUNG YIP <no-reply@mail.life-sg.com>
OMS_INTEGRATION_NOTIFICATION_REPLY_TO=support@life-sg.com
```

## 支付切换

- YeahPay 每次下单会传入新的 `callback` 和 `notifyUrl`；上线后必须完成一笔小额 PayNow/银行卡端到端验收。
- Stripe 商户后台新增 `https://life-sg.com/api/v1/payment/stripe/webhook`，验证成功后再删除旧端点。
- 为了处理切换前已创建的支付单，旧域名的 YeahPay/Stripe webhook 路径至少保留 7 天反向代理；其余页面可 301 到新域名。

## 物流与 OMS

- J&T 报价由服务器参数 `IKEA_SHIPPING_CARRIER` / `IKEA_SHIPPING_SERVICE_CODE` / `IKEA_JT_STANDARD_DELIVERY_FEE` 提供，没有绑定站点域名，域名切换时不改承运商和运费。
- `BUZUD_OMS_GATEWAY_URL` 是服务端内部对接地址，不应替换为前台域名。
- 上线验收需覆盖：获取运费 → 下单 → 支付通知 → OMS 入账 → 物流单号回写。

## 邮件与 SEO

- 启用 `mail.life-sg.com` 发件前，先配置邮件服务商要求的 MX/SPF/DKIM/DMARC 记录并完成发件域验证。
- 验收 `/robots.txt` 与 `/sitemap.xml` 仅输出 `https://life-sg.com`，并在 Google Search Console 重新提交 sitemap。
