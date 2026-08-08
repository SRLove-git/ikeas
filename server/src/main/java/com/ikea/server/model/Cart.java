package com.ikea.server.model;

import java.math.BigDecimal;
import java.util.List;

public record Cart(List<CartItem> items, int totalQuantity, BigDecimal totalPrice) {}
