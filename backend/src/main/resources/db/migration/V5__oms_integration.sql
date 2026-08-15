-- V5: OMS 对接映射表（对接规范 §6.1 / §6.2）
-- 商品映射：BUZUD productId ↔ OMS skuId，下单必须命中；
-- 订单映射：BUZUD orderNo ↔ OMS 订单号，记录同步状态与重试信息。

CREATE TABLE oms_sku_mapping (
    id            BIGINT         NOT NULL,
    product_id    VARCHAR(64)    NOT NULL,
    oms_sku_id    BIGINT         NOT NULL,
    oms_sku_no    VARCHAR(64),
    sync_price    DECIMAL(18,2),
    sync_stock    INTEGER,
    last_sync_at  TIMESTAMP,
    deleted       SMALLINT       NOT NULL DEFAULT 0,
    version       INTEGER        NOT NULL DEFAULT 0,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_oms_sku_mapping PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_oms_sku_mapping_product
    ON oms_sku_mapping (product_id)
    WHERE deleted = 0;

CREATE UNIQUE INDEX uk_oms_sku_mapping_sku
    ON oms_sku_mapping (oms_sku_id)
    WHERE deleted = 0;

CREATE TABLE oms_order_mapping (
    id                BIGINT         NOT NULL,
    order_no          VARCHAR(64)    NOT NULL,
    external_order_no VARCHAR(64)    NOT NULL,
    oms_order_no      VARCHAR(64),
    oms_status        SMALLINT,
    sync_status       SMALLINT       NOT NULL DEFAULT 0,
    last_error        VARCHAR(500),
    retry_count       INTEGER        NOT NULL DEFAULT 0,
    next_retry_at     TIMESTAMP,
    deleted           SMALLINT       NOT NULL DEFAULT 0,
    version           INTEGER        NOT NULL DEFAULT 0,
    created_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_oms_order_mapping PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_oms_order_mapping_order
    ON oms_order_mapping (order_no)
    WHERE deleted = 0;

CREATE UNIQUE INDEX uk_oms_order_mapping_external
    ON oms_order_mapping (external_order_no)
    WHERE deleted = 0;

CREATE INDEX idx_oms_order_mapping_sync
    ON oms_order_mapping (sync_status, next_retry_at);
