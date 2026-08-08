package com.ikea.server.model;

public record CartItem(String productId, int quantity, Product product) {}
