package com.ikea.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "账号不能为空") @Size(max = 128, message = "账号长度不能超过 128 位")
        String account,
    @NotBlank(message = "密码不能为空")
        @Size(min = 6, max = 64, message = "密码长度需为 6-64 位")
        String password,
    @Email(message = "邮箱格式不正确") @Size(max = 128, message = "邮箱长度不能超过 128 位")
        String email,
    @NotBlank(message = "邮箱验证码不能为空")
        @Pattern(regexp = "^\\d{6}$", message = "邮箱验证码格式不正确")
        String emailCode,
    @Size(max = 64, message = "昵称长度不能超过 64 位") String name,
    @Size(max = 32, message = "邀请码长度不能超过 32 位") String referralCode) {}
