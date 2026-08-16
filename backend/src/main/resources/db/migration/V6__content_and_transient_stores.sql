-- V6: 将商品/分类/菜单/页面/首页等静态内容，以及购物袋、客服聊天记录
--     从 JSON/内存态迁移到 PostgreSQL，统一由 MyBatis-Plus 访问。
--
-- 说明：
-- 1) 复杂文档使用 JSONB 存原始 payload，Java 侧解析为现有 model record；
-- 2) 所有表遵循项目规范：snake_case、单数表名、主键 id、软删除 deleted、
--    乐观锁 version、created_at/updated_at；
-- 3) 本迁移只建表，不插入业务数据；业务数据由启动时的 JSON 种子迁移完成。

CREATE TABLE product (
    id            BIGINT       NOT NULL,
    product_id    VARCHAR(64)  NOT NULL,
    slug          VARCHAR(256) NOT NULL,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_product PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_product_product_id
    ON product (product_id)
    WHERE deleted = 0;

CREATE UNIQUE INDEX uk_product_slug
    ON product (slug)
    WHERE deleted = 0;

CREATE TABLE catalog_category (
    id            BIGINT       NOT NULL,
    slug          VARCHAR(128) NOT NULL,
    kind          VARCHAR(16)  NOT NULL,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_catalog_category PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_catalog_category_slug_kind
    ON catalog_category (slug, kind)
    WHERE deleted = 0;

CREATE TABLE menu_category (
    id            BIGINT       NOT NULL,
    name          VARCHAR(128) NOT NULL,
    url           VARCHAR(512) NOT NULL,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_menu_category PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_menu_category_url
    ON menu_category (url)
    WHERE deleted = 0;

CREATE TABLE menu_panel (
    id            BIGINT       NOT NULL,
    label         VARCHAR(128) NOT NULL,
    href          VARCHAR(512),
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_menu_panel PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_menu_panel_label
    ON menu_panel (label)
    WHERE deleted = 0;

CREATE TABLE catalog_page (
    id            BIGINT       NOT NULL,
    url           VARCHAR(512) NOT NULL,
    slug          VARCHAR(128) NOT NULL,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_catalog_page PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_catalog_page_url
    ON catalog_page (url)
    WHERE deleted = 0;

CREATE UNIQUE INDEX uk_catalog_page_slug
    ON catalog_page (slug)
    WHERE deleted = 0;

CREATE TABLE content_page (
    id            BIGINT       NOT NULL,
    url           VARCHAR(512) NOT NULL,
    family        VARCHAR(64)  NOT NULL,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_content_page PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_content_page_url
    ON content_page (url)
    WHERE deleted = 0;

CREATE INDEX idx_content_page_family
    ON content_page (family);

CREATE TABLE homepage (
    id            BIGINT       NOT NULL,
    singleton_key SMALLINT     NOT NULL DEFAULT 1,
    payload       JSONB        NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_homepage PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_homepage_singleton
    ON homepage (singleton_key)
    WHERE deleted = 0;

CREATE TABLE cart_item (
    id            BIGINT       NOT NULL,
    user_id       BIGINT       NOT NULL,
    product_id    VARCHAR(64)  NOT NULL,
    quantity      INTEGER      NOT NULL,
    added_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_cart_item PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_cart_item_user_product
    ON cart_item (user_id, product_id)
    WHERE deleted = 0;

CREATE INDEX idx_cart_item_user_id
    ON cart_item (user_id);

CREATE TABLE chat_message (
    id            BIGINT       NOT NULL,
    user_id       BIGINT,
    message       TEXT         NOT NULL,
    reply         TEXT         NOT NULL,
    deleted       SMALLINT     NOT NULL DEFAULT 0,
    version       INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_chat_message PRIMARY KEY (id)
);

CREATE INDEX idx_chat_message_created_at
    ON chat_message (created_at);

CREATE INDEX idx_chat_message_user_id
    ON chat_message (user_id);
