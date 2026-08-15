package com.ikea.server.integration.oms;

import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderOutcome;
import com.ikea.server.integration.oms.OmsDtos.OpenCreateOrderRequest;
import com.ikea.server.integration.oms.OmsDtos.OpenOrderItem;
import com.ikea.server.integration.oms.OmsDtos.OpenOrderResponse;
import com.ikea.server.integration.oms.OmsDtos.OpenPaymentNotifyRequest;
import com.ikea.server.integration.oms.OmsDtos.OmsResult;
import java.math.BigDecimal;
import java.util.List;

/** OMS Open API 适配器实现：唯一解析 OMS 契约 DTO 的类（防腐层边界，对接规范 §8.3）。 */
public class OmsOpenApiChannel implements OmsChannel {

  private static final String ORDERS_PATH = "/api/v1/open/orders";

  private final OmsProperties properties;
  private final OmsHttpClient client;

  public OmsOpenApiChannel(OmsProperties properties, OmsHttpClient client) {
    this.properties = properties;
    this.client = client;
  }

  @Override
  public boolean isEnabled() {
    return true;
  }

  @Override
  public OmsOrderOutcome createOrder(OmsOrderInput input) {
    OpenCreateOrderRequest request =
        new OpenCreateOrderRequest(
            input.externalOrderNo(),
            input.orderType() == null ? properties.getOrderType() : input.orderType(),
            input.remark(),
            input.consignee(),
            input.phone(),
            input.address(),
            input.deliveryFee(),
            input.items().stream().map(line -> new OpenOrderItem(line.skuId(), line.quantity())).toList());
    OmsResult<OpenOrderResponse> result =
        client.post(ORDERS_PATH, request, OpenOrderResponse.class);
    return toOutcome(result.data());
  }

  @Override
  public OmsOrderOutcome queryOrder(String externalOrderNo) {
    OmsResult<OpenOrderResponse> result =
        client.get(ORDERS_PATH + "/" + externalOrderNo, OpenOrderResponse.class);
    return toOutcome(result.data());
  }

  @Override
  public void notifyPayment(
      String externalOrderNo, String paymentNo, BigDecimal amount, String channel) {
    OpenPaymentNotifyRequest request =
        new OpenPaymentNotifyRequest(paymentNo, amount, channel, null, null);
    client.post(
        ORDERS_PATH + "/" + externalOrderNo + "/payment-notify",
        request,
        OpenOrderResponse.class);
  }

  @Override
  public void cancelOrder(String externalOrderNo) {
    client.post(ORDERS_PATH + "/" + externalOrderNo + "/cancel", null, Void.class);
  }

  private static OmsOrderOutcome toOutcome(OpenOrderResponse response) {
    if (response == null) {
      throw new OmsCallException(0, "OMS 下单响应数据为空");
    }
    return new OmsOrderOutcome(
        response.orderNo(), response.status(), response.totalAmount(), response.currency());
  }
}
