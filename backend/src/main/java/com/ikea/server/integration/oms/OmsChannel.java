package com.ikea.server.integration.oms;

import java.math.BigDecimal;
import java.util.List;

/**
 * OMS 通道端口（对接规范 §8.2）：业务层只依赖本接口，不 import 任何 OMS 契约 DTO。
 * 更换订单中台时仅替换实现类；未对接时装配 {@link DisabledOmsChannel}。
 */
public interface OmsChannel {

  boolean isEnabled();

  /** 幂等下单（externalOrderNo 为幂等键），返回 OMS 订单结果。 */
  OmsOrderOutcome createOrder(OmsOrderInput input);

  /** 按外部订单号查单。 */
  OmsOrderOutcome queryOrder(String externalOrderNo);

  /** 支付成功通知（paymentNo 幂等，amount 必须等于 OMS 应付金额）。 */
  void notifyPayment(String externalOrderNo, String paymentNo, BigDecimal amount, String channel);

  /** 取消待支付订单。 */
  void cancelOrder(String externalOrderNo);

  record OmsOrderInput(
      String externalOrderNo,
      Integer orderType,
      String remark,
      String consignee,
      String phone,
      String address,
      BigDecimal deliveryFee,
      List<Line> items) {

    public record Line(Long skuId, int quantity) {}
  }

  record OmsOrderOutcome(String omsOrderNo, Integer status, BigDecimal totalAmount, String currency) {}
}
