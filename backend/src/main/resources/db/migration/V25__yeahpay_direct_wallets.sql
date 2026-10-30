-- YeahPay 直连钱包每次发起都使用唯一的 thirdOrderId。
-- 保留渠道单号映射，使得重试后到达的旧回调仍能安全落到原商城订单。

ALTER TABLE payment_attempt
    ADD COLUMN provider_order_no VARCHAR(64),
    ADD COLUMN presentation VARCHAR(16);

CREATE TABLE payment_provider_order (
    provider          VARCHAR(32) NOT NULL,
    provider_order_no VARCHAR(64) NOT NULL,
    order_no          VARCHAR(64) NOT NULL,
    channel           VARCHAR(32) NOT NULL,
    created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_provider_order PRIMARY KEY (provider, provider_order_no)
);

CREATE INDEX idx_payment_provider_order_local
    ON payment_provider_order (order_no, created_at);
