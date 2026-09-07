-- 交易与履约真实化：物流轨迹、发票/收据、缺货提醒、商城自助售后

CREATE TABLE logistics_record (
    id           BIGINT       NOT NULL,
    order_no     VARCHAR(64)  NOT NULL,
    carrier      VARCHAR(64),
    tracking_no  VARCHAR(64),
    status       VARCHAR(64),
    trace_info   TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_logistics_record PRIMARY KEY (id)
);

CREATE INDEX idx_logistics_order_no ON logistics_record (order_no);

CREATE TABLE invoice_receipt (
    id             BIGINT       NOT NULL,
    order_no       VARCHAR(64)  NOT NULL,
    user_id        BIGINT,
    kind           SMALLINT     NOT NULL DEFAULT 1,
    company_name   VARCHAR(128),
    tax_number     VARCHAR(64),
    email          VARCHAR(128),
    status         SMALLINT     NOT NULL DEFAULT 0,
    file_url       VARCHAR(512),
    error_message  VARCHAR(512),
    deleted        SMALLINT     NOT NULL DEFAULT 0,
    version        INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_invoice_receipt PRIMARY KEY (id)
);

CREATE INDEX idx_invoice_receipt_order ON invoice_receipt (order_no);
CREATE INDEX idx_invoice_receipt_user ON invoice_receipt (user_id);

CREATE TABLE stock_alert (
    id           BIGINT       NOT NULL,
    user_id      BIGINT,
    product_id   VARCHAR(64)  NOT NULL,
    contact      VARCHAR(128) NOT NULL,
    status       SMALLINT     NOT NULL DEFAULT 0,
    notified_at  TIMESTAMP,
    deleted      SMALLINT     NOT NULL DEFAULT 0,
    version      INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_stock_alert PRIMARY KEY (id)
);

CREATE INDEX idx_stock_alert_product ON stock_alert (product_id, status);

CREATE TABLE after_sale_request (
    id             BIGINT       NOT NULL,
    order_no       VARCHAR(64)  NOT NULL,
    user_id        BIGINT,
    type           SMALLINT     NOT NULL DEFAULT 1,
    reason         VARCHAR(512),
    status         SMALLINT     NOT NULL DEFAULT 0,
    oms_return_no  VARCHAR(64),
    deleted        SMALLINT     NOT NULL DEFAULT 0,
    version        INTEGER      NOT NULL DEFAULT 0,
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_after_sale_request PRIMARY KEY (id)
);

CREATE INDEX idx_after_sale_request_order ON after_sale_request (order_no);
CREATE INDEX idx_after_sale_request_user ON after_sale_request (user_id);
