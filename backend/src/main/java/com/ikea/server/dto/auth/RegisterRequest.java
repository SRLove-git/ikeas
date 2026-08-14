package com.ikea.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "账号不能为空") @Size(max = 128, message = "账号长度不能超过 128 位")
        String account,
    @NotBlank(message = "密码不能为空")
        @Size(min = 6, max = 64, message = "密码长度需为 6-64 位")
        String password,
    @Size(max = 64, message = "昵称长度不能超过 64 位") String name) {}
