-- V4: 订单与订单项持久化
-- 目标：将原先仅存在于前端 JSON 的订单流转迁移到 PostgreSQL，
-- 供 BUZUD 商城下单、查单、取消，并为后续对接 OMS 预留 order_no 幂等键。

CREATE TABLE orders (
    id            BIGINT         NOT NULL,
    order_no      VARCHAR(64)    NOT NULL,
    user_id       BIGINT         NOT NULL,
    status        SMALLINT       NOT NULL DEFAULT 1,
    currency      VARCHAR(16)    NOT NULL DEFAULT 'SGD',
    subtotal      DECIMAL(18,2)  NOT NULL DEFAULT 0,
    delivery_fee  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    total_amount  DECIMAL(18,2)  NOT NULL DEFAULT 0,
    customer      VARCHAR(128),
    phone         VARCHAR(32),
    address       VARCHAR(512),
    remark        VARCHAR(512),
    deleted       SMALLINT       NOT NULL DEFAULT 0,
    version       INTEGER        NOT NULL DEFAULT 0,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_orders PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_orders_order_no
    ON orders (order_no)
    WHERE deleted = 0;

CREATE INDEX idx_orders_user_id
    ON orders (user_id, created_at);

CREATE TABLE order_item (
    id            BIGINT         NOT NULL,
    order_id      BIGINT         NOT NULL,
    product_id    VARCHAR(64)    NOT NULL,
    product_name  VARCHAR(256)   NOT NULL,
    image         VARCHAR(512),
    unit_price    DECIMAL(18,2)  NOT NULL DEFAULT 0,
    quantity      INTEGER        NOT NULL,
    deleted       SMALLINT       NOT NULL DEFAULT 0,
    version       INTEGER        NOT NULL DEFAULT 0,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_order_item PRIMARY KEY (id)
);

CREATE INDEX idx_order_item_order_id
    ON order_item (order_id);
