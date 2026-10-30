# YeahPay 电子钱包与 OMS 入账

实现依据：[YeahPay Trade API](https://payment.yeahpay.net/api/#/apiDocCenter?type=trade-api) 的
`POST /order/unifiedOrder`、`POST /cardOrder/getRedirectUrl` 和
`POST /order/queryOrder`。

## 支付方式

| 商城渠道 | YeahPay `payWay` | 路由 | OMS `channel` |
| --- | --- | --- | --- |
| `paynow` | `PayNowPay` | `unifiedOrder` 直连（`NATIVE` / `MWEB`） | `paynow` |
| `wechatpay` | `WXZF` | YeahPay 托管收银台（PC 二维码 / 移动 H5） | `wechat` |
| `alipay` | `ZFBZF` | YeahPay 托管收银台 | `alipay` |

PayNow `NATIVE` 响应中的 `data.tdCode` 由商城前端在本地生成 SVG 二维码；
`MWEB` 响应必须是不含凭据的 HTTPS 地址，然后才允许浏览器跳转。
微信支付和支付宝按 MID 实际开通能力使用托管收银台，不调用会被拒绝的直连通道。
桌面浏览器选择微信支付时使用 `getPcRedirectUrl`，移动浏览器使用 `getRedirectUrl`。

## 订单与幂等

- 每次 PayNow 直连请求生成独立的 32 位 `thirdOrderId`，不复用商城订单号。
- `payment_provider_order` 保留渠道单号到商城订单号及钱包类型的映射。
- 一个商城订单只能写入一笔成功交易；回调、主动查单和重试共用同一个订单锁。
- 网络超时只记为未知，不会当作失败解锁重复付款。
- 只有 YeahPay 明确返回已关闭或失败，才允许再次创建渠道订单。

## 回调、查单与 OMS

1. YeahPay 回调先验证签名、时间窗口、`appId` 和 `merchantId`。
2. 商城以库内映射解析 `thirdOrderId`，再精确核对金额和币种。
3. 没有到达回调时，前端每 10 秒调用商城刷新接口，由服务端调用 YeahPay `queryOrder`。
4. 确认 `status=2` 后，商城幂等写入支付交易、推进订单状态，并调用 OMS
   `/api/v1/open/orders/{externalOrderNo}/payment-notify`。
5. OMS 请求包含 `paymentNo`、`amount`、`channel`、`channelTxnNo` 和 `paidAt`；
   `paymentNo` 与 `channelTxnNo` 都使用 YeahPay 交易号，便于对账。

## 配置与上线门槛

```dotenv
IKEA_PAYMENT_MOCK_ONLY=false
IKEA_YEAHPAY_ENABLED=true
IKEA_YEAHPAY_PC_CHECKOUT_ENABLED=true
IKEA_YEAHPAY_ENABLED_METHODS=paynow,wechatpay,alipay,visa,mastercard,amex
IKEA_YEAHPAY_NOTIFY_URL=https://medical-sg.com/api/v1/payment/yeahpay/webhook
```

API 凭据、商户 MID、出口 IP 白名单和每个 `payWay` 的收单权限必须在 YeahPay 商户后台完成。
本地测试和生产健康检查不能代替一笔小额真实钱包付款的端到端验收。
