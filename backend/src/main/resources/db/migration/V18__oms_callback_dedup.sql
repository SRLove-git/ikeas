-- V18: OMS → 商城回调幂等去重表
-- 商城接收 OMS 回调时按 event_id 去重，重复投递直接返回成功，保证事件至少/至多一次语义可收敛。

CREATE TABLE oms_callback_event (
    id          BIGINT      NOT NULL,
    event_id    VARCHAR(64) NOT NULL,
    event_type  VARCHAR(64),
    deleted     SMALLINT    NOT NULL DEFAULT 0,
    version     INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_oms_callback_event PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_oms_callback_event_event_id
    ON oms_callback_event (event_id)
    WHERE deleted = 0;

CREATE INDEX idx_oms_callback_event_type
    ON oms_callback_event (event_type);
