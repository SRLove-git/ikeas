package com.ikea.server.dto.auth;

public record SsoCodeResponse(String code, long expiresIn) {}
