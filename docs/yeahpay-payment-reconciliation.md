# YeahPay 支付确认与重试

依据：[交易接口](https://payment.yeahpay.net/api/#/apiDocCenter?type=trade-api) §2、§4.3、§4.7、§6；[参数管理](https://payment.yeahpay.net/api/#/apiDocCenter?type=manual-params)。

## 接口

`POST /api/v1/payment/orders/{orderNo}/refresh` 需要登录，只允许订单所属用户查询。返回：

```json
{"status":"unknown","retryAllowed":false}
```

| status | 含义 |
| --- | --- |
| paid | 商城已有付款记录，或渠道成功结果经完整核验并提交入账 |
| pending | 正在创建会话或渠道返回支付中 |
| failed / closed | 渠道明确失败/关闭，或商城订单已关闭；是否可重试以 retryAllowed 为准 |
| not_started | 尚无支付会话 |
| unknown | 渠道查不到订单、信息不全或状态未识别，不能据此推断扣款情况 |
| unavailable | 查询暂不可用或当前支付渠道不支持此查单接口 |

前端支付返回后只查询目标订单，最多四次，间隔十秒；也可手动更新状态。浏览器 URL 的 `payment=success` 不作为入账凭据。

## 状态及一致性

- YeahPay 支付回调只推送成功状态；`algorithm` 缺省时按 SHA-512 验签，显式其他算法仍拒绝。必须核验其他必要头、时间窗及原始请求体签名。
- 主动查询使用 `merchantId + thirdOrderId`。成功结果必须匹配商户、商城订单号、应付金额和币种，且包含渠道交易号；禁止金额小数截断。
- 查询与回调按支付会话行锁串行处理。交易记录、会话成功状态和商城入账处于同一事务；任一结算步骤失败则全部回滚。
- 每次查询保存安全的状态、响应码、traceId 和查询时间，短时缓存十秒。新会话创建的前六十秒不使用渠道旧订单状态解锁会话。
- `10012` 不等于支付失败；查询异常、字段缺失及退款相关未知状态不开放新支付。
- 失败/关闭必须包含可绑定的渠道交易号；重试后再次查到上一笔失败交易时保持未确认，防止旧结果解锁新会话。
- YeahPay 不再按本地十五分钟超时自动重建。明确拒绝创建，或已核实渠道失败/关闭后才允许重新创建。请求超时可能已在渠道生效，保持未确认状态。
- 保存托管收银台 URL，未确认时相同支付方式复用原地址。URL 含会话凭证，仅存于服务端数据库、仅向订单本人返回，不得记录到日志。旧会话没有地址且状态不明时，需先核实渠道结果。

## 部署与验证

本变更新增 Flyway `V24__payment_reconciliation.sql`，不修改原有迁移。正常启动后端会为 `payment_attempt` 增加会话地址和查询诊断字段；发布前需备份数据库。

后端执行 `./mvnw test`；可通过 `PAYMENT_TEST_DATABASE_URL` 启用独立 PostgreSQL 支付持久化测试（只使用专门的测试数据库）。前端执行 `node --test tests/payment-status.test.mjs` 和 `npm run check`。测试不能替代真实渠道支付及成功回调验收。

这里接收的是交易接口 §4.7 的支付通知。独立的“订单流水消息推送”使用其他字段、状态和签名规则，尚未接入；不要把该推送直接指向现有 `/payment/yeahpay/webhook`。
