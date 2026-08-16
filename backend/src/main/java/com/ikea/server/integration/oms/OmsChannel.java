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

  /** 商城用户申请退款，OMS 侧创建售后/退款申请单。 */
  void requestRefund(String externalOrderNo);

  /** 查询商城订单在 OMS 侧的最新售后/退款状态。 */
  ReturnOrderOutcome queryReturnOrder(String externalOrderNo);

  /** 在售 SKU 分页查询（含实时可售库存，对接规范 §5.2）。 */
  OmsProductPage productsOnSale(String keyword, int page, int size);

  /** 单个 SKU 实时库存查询。 */
  OmsStock availableStock(Long skuId);

  record OmsOrderInput(
      String externalOrderNo,
      Integer orderType,
      String remark,
      String consignee,
      String phone,
      String address,
      BigDecimal deliveryFee,
      BigDecimal discountAmount,
      List<Line> items) {

    public record Line(Long skuId, int quantity) {}
  }

  record OmsOrderOutcome(String omsOrderNo, Integer status, BigDecimal totalAmount, String currency) {}

  record OmsProduct(
      Long skuId, String skuNo, String name, BigDecimal price, int availableStock) {}

  record OmsProductPage(List<OmsProduct> items, long total) {}

  record OmsStock(Long skuId, String skuNo, int availableStock) {}

  record ReturnOrderOutcome(String returnNo, Integer status, String reason, BigDecimal totalAmount) {}
}
