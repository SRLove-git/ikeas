package com.ikea.server.model;

/** Public user profile returned by the auth API (no credentials). */
public record User(
    String id, String name, String phone, String email, String createdAt) {}
