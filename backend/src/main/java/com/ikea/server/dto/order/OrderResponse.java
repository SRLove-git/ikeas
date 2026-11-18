package com.ikea.server.dto.order;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
    Long id,
    String orderNo,
    int status,
    String statusLabel,
    String currency,
    // Old orders predate the split; keep the key present as null for clients.
    @JsonInclude(JsonInclude.Include.ALWAYS) String salesChannel,
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
