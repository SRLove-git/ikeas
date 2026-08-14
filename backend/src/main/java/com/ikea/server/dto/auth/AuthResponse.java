package com.ikea.server.dto.auth;

import com.ikea.server.model.User;

public record AuthResponse(
    String token, String refreshToken, long expiresIn, String tokenType, User user) {}
