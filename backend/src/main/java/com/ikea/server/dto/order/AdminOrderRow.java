package com.ikea.server.dto.order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** 管理后台订单列表行，含 userId 以便关联用户信息。 */
public record AdminOrderRow(
    Long id,
    String orderNo,
    Long userId,
    int status,
    String statusLabel,
    String currency,
    BigDecimal subtotal,
    BigDecimal deliveryFee,
    BigDecimal totalAmount,
    String customer,
    String phone,
    String address,
    String remark,
    List<OrderItemResponse> items,
    LocalDateTime createdAt,
    LocalDateTime updatedAt) {}
