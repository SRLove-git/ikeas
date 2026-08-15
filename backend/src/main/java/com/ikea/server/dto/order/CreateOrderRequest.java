package com.ikea.server.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
    @Valid List<CreateOrderItemRequest> items,
    boolean fromCart,
    BigDecimal deliveryFee,
    @Size(max = 128, message = "收货人姓名不能超过 128 位") String customer,
    @Size(max = 32, message = "手机号不能超过 32 位") String phone,
    @Size(max = 512, message = "收货地址不能超过 512 位") String address,
    @Size(max = 512, message = "订单备注不能超过 512 位") String remark) {}
