package com.ikea.server.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record EmailCodeSendRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email) {}
