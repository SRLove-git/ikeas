CREATE TABLE experience_voucher (
    id                BIGINT       NOT NULL,
    code              VARCHAR(64)  NOT NULL,
    status            SMALLINT     NOT NULL DEFAULT 0,
    used_booking_id   VARCHAR(64),
    used_at           TIMESTAMP,
    remark            VARCHAR(255),
    deleted           SMALLINT     NOT NULL DEFAULT 0,
    version           INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_experience_voucher PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_experience_voucher_code
    ON experience_voucher (code)
    WHERE deleted = 0;

CREATE INDEX idx_experience_voucher_status
    ON experience_voucher (status, created_at);
