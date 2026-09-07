ALTER TABLE member_account
    ADD COLUMN level SMALLINT NOT NULL DEFAULT 1,
    ADD COLUMN total_spent DECIMAL(18,2) NOT NULL DEFAULT 0;

CREATE TABLE product_review (
    id          BIGINT        NOT NULL,
    product_id  VARCHAR(64)   NOT NULL,
    user_id     BIGINT        NOT NULL,
    order_no    VARCHAR(64),
    rating      SMALLINT      NOT NULL DEFAULT 5,
    content     VARCHAR(1000),
    images      TEXT,
    status      SMALLINT      NOT NULL DEFAULT 1,
    deleted     SMALLINT      NOT NULL DEFAULT 0,
    version     INTEGER       NOT NULL DEFAULT 0,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT pk_product_review PRIMARY KEY (id)
);

CREATE INDEX idx_product_review_product ON product_review (product_id, status);
CREATE INDEX idx_product_review_user ON product_review (user_id);

CREATE TABLE support_ticket (
    id             BIGINT        NOT NULL,
    ticket_no      VARCHAR(64)   NOT NULL,
    user_id        BIGINT,
    order_no       VARCHAR(64),
    after_sale_no  VARCHAR(64),
    subject        VARCHAR(200)  NOT NULL,
    message        VARCHAR(2000) NOT NULL,
    status         SMALLINT      NOT NULL DEFAULT 0,
    assignee       VARCHAR(64),
    reply          VARCHAR(2000),
    replied_at     TIMESTAMP,
    deleted        SMALLINT      NOT NULL DEFAULT 0,
    version        INTEGER       NOT NULL DEFAULT 0,
    created_at     TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT pk_support_ticket PRIMARY KEY (id)
);

CREATE INDEX idx_support_ticket_user ON support_ticket (user_id);
CREATE INDEX idx_support_ticket_status ON support_ticket (status);
