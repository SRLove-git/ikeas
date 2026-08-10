-- V1: 初始基线（1.1 数据库接入验证；1.2 将补充核心业务表）
-- 注意：PostgreSQL 中 user 为保留字，用户表统一使用 app_user。

CREATE TABLE app_user (
    id            BIGINT       NOT NULL,
    username      VARCHAR(64)  NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(128),
    password_hash VARCHAR(100),
    status        SMALLINT     NOT NULL DEFAULT 1,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_app_user PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_app_user_username ON app_user (username) WHERE deleted = 0;
