-- V11: 裂变邀请与邀请奖励
-- 邀请关系按 invitee_id 唯一，确保同一新用户只给同一位邀请人计一次奖励。

CREATE TABLE referral (
    id          BIGINT       NOT NULL,
    inviter_id  BIGINT       NOT NULL,
    invitee_id  BIGINT       NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_referral PRIMARY KEY (id)
);

CREATE UNIQUE INDEX uk_referral_invitee ON referral (invitee_id);
CREATE INDEX idx_referral_inviter ON referral (inviter_id);

CREATE TABLE referral_reward (
    id              BIGINT       NOT NULL,
    inviter_id      BIGINT       NOT NULL,
    invitee_id      BIGINT       NOT NULL,
    coupon_id       BIGINT       NOT NULL,
    user_coupon_id  BIGINT       NOT NULL,
    reward_type     VARCHAR(32)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_referral_reward PRIMARY KEY (id)
);

CREATE INDEX idx_referral_reward_inviter ON referral_reward (inviter_id, created_at);

INSERT INTO coupon (id, code, name, type, value, min_amount, status, valid_from, valid_to)
SELECT 9101, 'REFER5', '邀请好友立减 5 新币', 1, 5.00, 30.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM coupon WHERE id = 9101);

INSERT INTO coupon (id, code, name, type, value, min_amount, status, valid_from, valid_to)
SELECT 9102, 'REFER20', '邀请里程碑立减 20 新币', 1, 20.00, 100.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM coupon WHERE id = 9102);
