-- V2: 用户认证能力补齐
-- 1) app_user 增加角色字段，并为 phone/email 增加部分唯一索引。
-- 2) 刷新令牌落库，支持续期、吊销与审计。

ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER';

ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS name VARCHAR(64);

CREATE UNIQUE INDEX IF NOT EXISTS uk_app_user_phone
    ON app_user (phone)
    WHERE deleted = 0 AND phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_app_user_email
    ON app_user (email)
    WHERE deleted = 0 AND email IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_token (
    id            BIGINT       NOT NULL,
    user_id       BIGINT       NOT NULL,
    token_hash    VARCHAR(128) NOT NULL,
    token_type    VARCHAR(32)  NOT NULL,
    expires_at    TIMESTAMP    NOT NULL,
    revoked       SMALLINT     NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_user_token PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_user_token_user_id
    ON user_token (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_token_hash
    ON user_token (token_hash);
