package com.ikea.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SmsLoginRequest(
    @NotBlank(message = "手机号不能为空")
        @Pattern(regexp = "^[89]\\d{7}$", message = "手机号格式不正确")
        String phone,
    @NotBlank(message = "验证码不能为空")
        @Pattern(regexp = "^\\d{6}$", message = "验证码格式不正确")
        String code) {}
