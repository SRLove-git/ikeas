package com.ikea.server.constant;

import java.util.Arrays;

/** 订单状态枚举。状态码落库，label 用于前台展示。 */
public enum OrderStatus {
  PENDING_PAYMENT(1, "待付款"),
  PENDING_SHIPMENT(2, "待发货"),
  PENDING_RECEIPT(3, "待收货"),
  COMPLETED(4, "已完成"),
  CANCELLED(5, "已取消"),
  REFUNDING(6, "退款中");

  private final int code;
  private final String label;

  OrderStatus(int code, String label) {
    this.code = code;
    this.label = label;
  }

  public int code() {
    return code;
  }

  public String label() {
    return label;
  }

  public static OrderStatus fromCode(Integer code) {
    if (code == null) {
      return null;
    }
    return Arrays.stream(values())
        .filter(status -> status.code == code)
        .findFirst()
        .orElse(null);
  }
}
