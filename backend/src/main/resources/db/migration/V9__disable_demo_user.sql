-- 问题 02：停用登录页曾公开的演示账号（demo@ikea.cn / 13800138000 / 123456）。
-- 仅停用不删除，保留审计痕迹；AuthService.ensureActive 会拒绝 status != 1 的账号登录。
UPDATE app_user
   SET status = 0,
       updated_at = CURRENT_TIMESTAMP
 WHERE username = 'demo@ikea.cn'
   AND status = 1;
