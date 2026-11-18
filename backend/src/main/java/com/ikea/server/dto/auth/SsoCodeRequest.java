package com.ikea.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SsoCodeRequest(
    @NotBlank(message = "target 不能为空")
        @Size(max = 16, message = "target 不能超过 16 位")
        String target) {}
