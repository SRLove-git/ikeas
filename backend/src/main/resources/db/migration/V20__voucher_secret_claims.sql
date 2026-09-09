-- 线下会议密钥领取体验券：记录邮箱领取，同一邮箱 + 同一密钥只领一次。

CREATE TABLE voucher_email_claim (
    id          BIGINT       NOT NULL,
    email       VARCHAR(128) NOT NULL,
    voucher_id  BIGINT       NOT NULL,
    secret      VARCHAR(64)  NOT NULL,
    status      SMALLINT     NOT NULL DEFAULT 1,
    deleted     SMALLINT     NOT NULL DEFAULT 0,
    version     INTEGER      NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_voucher_email_claim PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_voucher_email_claim_email_secret
    ON voucher_email_claim (email, secret)
    WHERE deleted = 0;
