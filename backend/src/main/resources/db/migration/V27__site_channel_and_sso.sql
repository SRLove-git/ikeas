-- V27: 站点拆分（medical-sg.com / home-sg.com，life-sg.com 作为统一账户与订单中心）
-- 1) orders 增加销售渠道，支付回跳与订单筛选按渠道区分。
-- 2) sso_code 保存跨站一次性授权码（仅存 SHA-256 哈希，120 秒有效，单次消费）。

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS sales_channel VARCHAR(16);

CREATE INDEX IF NOT EXISTS idx_orders_sales_channel_created_at
    ON orders (sales_channel, created_at);

CREATE TABLE IF NOT EXISTS sso_code (
    id          BIGINT       NOT NULL,
    code_hash   VARCHAR(128) NOT NULL,
    user_id     BIGINT       NOT NULL,
    target      VARCHAR(16)  NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    used        SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_sso_code PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_sso_code_code_hash
    ON sso_code (code_hash);
