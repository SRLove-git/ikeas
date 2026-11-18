package com.ikea.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SsoExchangeRequest(
    @NotBlank(message = "授权码不能为空")
        @Size(max = 256, message = "授权码长度非法")
        String code) {}
