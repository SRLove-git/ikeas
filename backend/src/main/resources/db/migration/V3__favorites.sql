-- V3: 收藏持久化
-- 将原本仅存于内存中的用户商品收藏迁移到 PostgreSQL。

CREATE TABLE favorite (
    id            BIGINT       NOT NULL,
    user_id       BIGINT       NOT NULL,
    product_id    VARCHAR(64)  NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_favorite PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_favorite_user_product
    ON favorite (user_id, product_id)
    WHERE deleted = 0;

CREATE INDEX idx_favorite_user_id
    ON favorite (user_id);
