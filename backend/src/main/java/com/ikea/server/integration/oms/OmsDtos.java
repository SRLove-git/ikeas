package com.ikea.server.integration.oms;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * OMS 契约 DTO（防腐层：仅在 adapter 包内解析使用，禁止外泄）。
 *
 * <p>与 OMS {@code order-service} 的 OpenOrderDtos 一一对应，字段对齐
 * oms/docs/open-api.md（含收货信息与配送费，见对接规范 §5.3）。
 */
public final class OmsDtos {

  private OmsDtos() {}

  public record OmsResult<T>(int code, String message, T data) {

    public boolean success() {
      return code == 0;
    }
  }

  public record OpenCreateOrderRequest(
      String externalOrderNo,
      Integer orderType,
      String remark,
      String consignee,
      String phone,
      String address,
      BigDecimal deliveryFee,
      List<OpenOrderItem> items) {}

  public record OpenOrderItem(Long skuId, int quantity) {}

  public record OpenPaymentNotifyRequest(
      String paymentNo, BigDecimal amount, String channel, String channelTxnNo, LocalDateTime paidAt) {}

  public record OpenOrderResponse(
      String orderNo,
      String externalOrderNo,
      String source,
      Integer orderType,
      Integer status,
      BigDecimal totalAmount,
      String currency,
      String remark,
      String consignee,
      String phone,
      String address,
      BigDecimal deliveryFee,
      LocalDateTime paidAt,
      LocalDateTime createdAt,
      List<OpenOrderItemResponse> items) {}

  public record OpenOrderItemResponse(
      Long id,
      Long skuId,
      String skuName,
      Integer quantity,
      BigDecimal unitPrice,
      BigDecimal totalPrice) {}
}
