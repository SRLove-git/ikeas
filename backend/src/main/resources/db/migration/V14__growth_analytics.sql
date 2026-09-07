CREATE TABLE user_event (
    id          BIGINT       NOT NULL,
    user_id     BIGINT,
    event_type  VARCHAR(32)  NOT NULL,
    product_id  VARCHAR(64),
    source      VARCHAR(64),
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_user_event PRIMARY KEY (id)
);

CREATE INDEX idx_user_event_type ON user_event (event_type, created_at);
CREATE INDEX idx_user_event_product ON user_event (product_id);

CREATE TABLE promotion (
    id            BIGINT       NOT NULL,
    code          VARCHAR(64)  NOT NULL,
    name          VARCHAR(128) NOT NULL,
    type          SMALLINT     NOT NULL DEFAULT 1,
    product_id    VARCHAR(64),
    discount_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    start_at      TIMESTAMP,
    end_at        TIMESTAMP,
    status        SMALLINT     NOT NULL DEFAULT 1,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_promotion PRIMARY KEY (id)
);

CREATE INDEX idx_promotion_status ON promotion (status, start_at, end_at);
