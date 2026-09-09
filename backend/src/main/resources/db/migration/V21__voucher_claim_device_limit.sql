-- 体验券领取防刷：同一 IP 或同一设备仅可领取一次。

ALTER TABLE voucher_email_claim
    ADD COLUMN ip         VARCHAR(64),
    ADD COLUMN device_id  VARCHAR(64);

CREATE INDEX idx_voucher_email_claim_ip
    ON voucher_email_claim (ip)
    WHERE deleted = 0;

CREATE INDEX idx_voucher_email_claim_device
    ON voucher_email_claim (device_id)
    WHERE deleted = 0;
