package com.ikea.server.dto.order;

import java.math.BigDecimal;

public record OrderItemResponse(
    String productId,
    String productName,
    String image,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal subtotal) {}
