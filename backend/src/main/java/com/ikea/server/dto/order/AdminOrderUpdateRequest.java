package com.ikea.server.dto.order;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** 管理后台可修改的订单字段。null 表示保持不变。 */
public record AdminOrderUpdateRequest(
    @Min(value = 1, message = "订单状态码不能小于 1")
        @Max(value = 6, message = "订单状态码不能大于 6")
        Integer status,
    @DecimalMin(value = "0.0", inclusive = true, message = "配送费不能为负数") BigDecimal deliveryFee,
    @Size(max = 128, message = "收货人姓名不能超过 128 位") String customer,
    @Size(max = 32, message = "手机号不能超过 32 位") String phone,
    @Size(max = 512, message = "收货地址不能超过 512 位") String address,
    @Size(max = 512, message = "订单备注不能超过 512 位") String remark) {}
