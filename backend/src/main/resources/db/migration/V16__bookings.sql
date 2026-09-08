CREATE TABLE booking (
    id                BIGINT       NOT NULL,
    booking_no        VARCHAR(32)  NOT NULL,
    customer_name     VARCHAR(64)  NOT NULL,
    phone             VARCHAR(16)  NOT NULL,
    email             VARCHAR(128) NOT NULL,
    voucher_code      VARCHAR(64)  NOT NULL,
    service_type      VARCHAR(128) NOT NULL,
    store             VARCHAR(128) NOT NULL,
    preferred_date    DATE         NOT NULL,
    time_slot         VARCHAR(64),
    note              VARCHAR(500),
    status            SMALLINT     NOT NULL DEFAULT 0,
    deleted           SMALLINT     NOT NULL DEFAULT 0,
    version           INTEGER      NOT NULL DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_booking PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_booking_no
    ON booking (booking_no)
    WHERE deleted = 0;

CREATE INDEX idx_booking_status
    ON booking (status, created_at);
