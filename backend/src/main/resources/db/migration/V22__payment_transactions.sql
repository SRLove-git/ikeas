-- 支付回调去重与交易对账。不保存签名原文、API 密钥或托管收银台 URL。

CREATE TABLE payment_transaction (
    provider         VARCHAR(32)  NOT NULL,
    order_no         VARCHAR(64)  NOT NULL,
    provider_txn_no  VARCHAR(128) NOT NULL,
    amount_minor     BIGINT       NOT NULL,
    currency         VARCHAR(8)   NOT NULL,
    status           SMALLINT     NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_transaction PRIMARY KEY (provider, order_no),
    CONSTRAINT uk_payment_transaction_provider_txn UNIQUE (provider, provider_txn_no)
);

CREATE TABLE payment_callback_event (
    event_key        VARCHAR(64)  NOT NULL,
    provider         VARCHAR(32)  NOT NULL,
    order_no         VARCHAR(64)  NOT NULL,
    provider_txn_no  VARCHAR(128) NOT NULL,
    received_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_callback_event PRIMARY KEY (event_key)
);

CREATE INDEX idx_payment_callback_order
    ON payment_callback_event (provider, order_no, received_at);
