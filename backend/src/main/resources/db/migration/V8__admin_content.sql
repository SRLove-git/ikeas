-- V8: 补齐内容管理后台仍在 Next.js 本地文件实现的轻量数据：
--     站点设置、变更日志、客服知识库。

CREATE TABLE site_setting (
    id            BIGINT       NOT NULL,
    singleton_key SMALLINT     NOT NULL DEFAULT 1,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_site_setting PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_site_setting_singleton
    ON site_setting (singleton_key)
    WHERE deleted = 0;

CREATE TABLE changelog_entry (
    id            BIGINT       NOT NULL,
    entry_id      VARCHAR(64)  NOT NULL,
    user_name     VARCHAR(64)  NOT NULL,
    action        VARCHAR(16)  NOT NULL,
    resource      VARCHAR(64)  NOT NULL,
    target        VARCHAR(512),
    summary       VARCHAR(1024),
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_changelog_entry PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_changelog_entry_entry_id
    ON changelog_entry (entry_id)
    WHERE deleted = 0;

CREATE INDEX idx_changelog_entry_created_at
    ON changelog_entry (created_at);

CREATE TABLE chat_knowledge (
    id            BIGINT       NOT NULL,
    singleton_key SMALLINT     NOT NULL DEFAULT 1,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_chat_knowledge PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_chat_knowledge_singleton
    ON chat_knowledge (singleton_key)
    WHERE deleted = 0;
