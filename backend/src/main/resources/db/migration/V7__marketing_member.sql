CREATE TABLE coupon (
    id            BIGINT         NOT NULL,
    code          VARCHAR(64)    NOT NULL,
    name          VARCHAR(128)   NOT NULL,
    type          SMALLINT       NOT NULL DEFAULT 1,
    value         DECIMAL(18,2)  NOT NULL DEFAULT 0,
    min_amount    DECIMAL(18,2)  NOT NULL DEFAULT 0,
    status        SMALLINT       NOT NULL DEFAULT 1,
    valid_from    TIMESTAMP      NOT NULL,
    valid_to      TIMESTAMP      NOT NULL,
    deleted       SMALLINT       NOT NULL DEFAULT 0,
    version       INTEGER        NOT NULL DEFAULT 0,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_coupon PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_coupon_code ON coupon (code) WHERE deleted = 0;

CREATE TABLE user_coupon (
    id             BIGINT         NOT NULL,
    user_id        BIGINT         NOT NULL,
    coupon_id      BIGINT         NOT NULL,
    status         SMALLINT       NOT NULL DEFAULT 1,
    used_order_no  VARCHAR(64),
    deleted        SMALLINT       NOT NULL DEFAULT 0,
    version        INTEGER        NOT NULL DEFAULT 0,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_user_coupon PRIMARY KEY (id)
);

CREATE INDEX idx_user_coupon_user ON user_coupon (user_id, status);

CREATE TABLE member_account (
    user_id        BIGINT         NOT NULL,
    points         INTEGER        NOT NULL DEFAULT 0,
    balance        DECIMAL(18,2)  NOT NULL DEFAULT 0,
    version        INTEGER        NOT NULL DEFAULT 0,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_member_account PRIMARY KEY (user_id)
);

CREATE TABLE point_log (
    id             BIGINT         NOT NULL,
    user_id        BIGINT         NOT NULL,
    change_amount  INTEGER        NOT NULL,
    type           VARCHAR(32)    NOT NULL,
    remark         VARCHAR(255),
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_point_log PRIMARY KEY (id)
);

CREATE TABLE balance_log (
    id             BIGINT         NOT NULL,
    user_id        BIGINT         NOT NULL,
    change_amount  DECIMAL(18,2)  NOT NULL,
    type           VARCHAR(32)    NOT NULL,
    remark         VARCHAR(255),
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_balance_log PRIMARY KEY (id)
);

INSERT INTO coupon (id, code, name, type, value, min_amount, status, valid_from, valid_to)
VALUES
    (9001, 'WELCOME10', '新人立减 10 新币', 1, 10.00, 50.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days'),
    (9002, 'SAVE20', '满 100 享 20% 折扣', 2, 20.00, 100.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days');

ALTER TABLE orders
    ADD COLUMN discount_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN coupon_code VARCHAR(64),
    ADD COLUMN used_points INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN used_balance DECIMAL(18,2) NOT NULL DEFAULT 0;
