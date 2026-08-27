-- 问题 06：游客结账。订单允许不关联登录账号（user_id 为空），
-- 联系与配送信息以提交时填写的为准。
ALTER TABLE orders
    ALTER COLUMN user_id DROP NOT NULL;
