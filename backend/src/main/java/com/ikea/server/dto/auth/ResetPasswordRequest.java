package com.ikea.server.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotBlank(message = "邮箱验证码不能为空")
        @Pattern(regexp = "^\\d{6}$", message = "邮箱验证码格式不正确")
        String emailCode,
    @NotBlank(message = "新密码不能为空")
        @Size(min = 6, max = 64, message = "密码长度需为 6-64 位")
        String newPassword) {}
