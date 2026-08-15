package com.ikea.server.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateOrderItemRequest(
    @NotBlank(message = "商品不能为空") String productId,
    @Min(value = 1, message = "商品数量至少为 1") Integer quantity) {}
