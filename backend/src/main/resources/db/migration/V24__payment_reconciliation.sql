-- 保留已创建的收银台地址，以便恢复同一会话；不保存原始支付响应或银行卡资料。
ALTER TABLE payment_attempt
    ADD COLUMN checkout_url TEXT,
    ADD COLUMN query_status VARCHAR(32),
    ADD COLUMN query_code VARCHAR(32),
    ADD COLUMN query_trace_id VARCHAR(128),
    ADD COLUMN last_checked_at TIMESTAMP,
    ADD COLUMN last_failed_txn_no VARCHAR(128);
