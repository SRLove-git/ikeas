-- 支付安全加固：一个商城订单只能绑定一笔成功交易，并限制短时间内重复创建托管收银台。

CREATE UNIQUE INDEX uk_payment_transaction_order_no
    ON payment_transaction (order_no);

CREATE TABLE payment_attempt (
    order_no    VARCHAR(64)  NOT NULL,
    provider    VARCHAR(32)  NOT NULL,
    channel     VARCHAR(32)  NOT NULL,
    status      SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_attempt PRIMARY KEY (order_no)
);

CREATE INDEX idx_payment_attempt_status_updated
    ON payment_attempt (status, updated_at);
