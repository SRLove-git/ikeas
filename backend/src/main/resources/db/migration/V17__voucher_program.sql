ALTER TABLE experience_voucher
    ADD COLUMN type         SMALLINT     NOT NULL DEFAULT 1,
    ADD COLUMN valid_until  TIMESTAMP,
    ADD COLUMN user_id      BIGINT,
    ADD COLUMN order_no     VARCHAR(64),
    ADD COLUMN batch_no     VARCHAR(64),
    ADD COLUMN qr_content   VARCHAR(512);

CREATE INDEX idx_experience_voucher_type_status
    ON experience_voucher (type, status, created_at)
    WHERE deleted = 0;

CREATE INDEX idx_experience_voucher_order
    ON experience_voucher (order_no)
    WHERE deleted = 0;

CREATE INDEX idx_experience_voucher_user
    ON experience_voucher (user_id, status, type)
    WHERE deleted = 0;

ALTER TABLE booking
    ADD COLUMN voucher_codes VARCHAR(512);
