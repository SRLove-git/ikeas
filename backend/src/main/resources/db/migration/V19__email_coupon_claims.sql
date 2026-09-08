CREATE TABLE email_coupon_claim (
    id             BIGINT         NOT NULL,
    email          VARCHAR(128)   NOT NULL,
    coupon_id      BIGINT         NOT NULL,
    status         SMALLINT       NOT NULL DEFAULT 1,
    deleted        SMALLINT       NOT NULL DEFAULT 0,
    version        INTEGER        NOT NULL DEFAULT 0,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_email_coupon_claim PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_email_coupon_claim_email_coupon
    ON email_coupon_claim (email, coupon_id)
    WHERE deleted = 0;

CREATE INDEX idx_email_coupon_claim_email
    ON email_coupon_claim (email, status);
