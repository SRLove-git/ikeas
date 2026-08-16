package com.ikea.server.integration.oms;

import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderOutcome;
import com.ikea.server.integration.oms.OmsDtos.OpenCreateOrderRequest;
import com.ikea.server.integration.oms.OmsDtos.OpenOrderItem;
import com.ikea.server.integration.oms.OmsDtos.OpenOrderResponse;
import com.ikea.server.integration.oms.OmsDtos.OpenPaymentNotifyRequest;
import com.ikea.server.integration.oms.OmsDtos.OpenProductPage;
import com.ikea.server.integration.oms.OmsDtos.OpenSkuResponse;
import com.ikea.server.integration.oms.OmsDtos.OpenStockResponse;
import com.ikea.server.integration.oms.OmsDtos.OmsResult;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/** OMS Open API 适配器实现：唯一解析 OMS 契约 DTO 的类（防腐层边界，对接规范 §8.3）。 */
public class OmsOpenApiChannel implements OmsChannel {

  private static final String ORDERS_PATH = "/api/v1/open/orders";
  private static final String RETURN_ORDERS_PATH = "/api/v1/open/return-orders";
  private static final String PRODUCTS_PATH = "/api/v1/open/products";
  private static final String SKUS_PATH = "/api/v1/open/skus";

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
            input.discountAmount(),
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

  @Override
  public void requestRefund(String externalOrderNo) {
    client.post(
        RETURN_ORDERS_PATH,
        new com.ikea.server.integration.oms.OmsDtos.OpenReturnOrderRequest(externalOrderNo, 1, "商城用户申请退款"),
        Void.class);
  }

  @Override
  public ReturnOrderOutcome queryReturnOrder(String externalOrderNo) {
    OmsResult<OmsDtos.OpenReturnOrderResponse> result =
        client.get(
            RETURN_ORDERS_PATH + "/by-external/" + urlEncode(externalOrderNo),
            OmsDtos.OpenReturnOrderResponse.class);
    OmsDtos.OpenReturnOrderResponse data = result.data();
    if (data == null) {
      throw new OmsCallException(0, "OMS 售后查询响应数据为空");
    }
    return new ReturnOrderOutcome(
        data.returnNo(), data.status(), data.reason(), data.totalAmount());
  }

  @Override
  public OmsProductPage productsOnSale(String keyword, int page, int size) {
    String path =
        PRODUCTS_PATH
            + "?keyword="
            + urlEncode(keyword == null ? "" : keyword)
            + "&page="
            + Math.max(1, page)
            + "&size="
            + Math.max(1, size);
    OmsResult<OpenProductPage> result = client.get(path, OpenProductPage.class);
    OpenProductPage data = result.data();
    if (data == null || data.records() == null) {
      return new OmsProductPage(List.of(), 0);
    }
    return new OmsProductPage(
        data.records().stream().map(OmsOpenApiChannel::toProduct).toList(), data.total());
  }

  @Override
  public OmsStock availableStock(Long skuId) {
    OmsResult<OpenStockResponse> result =
        client.get(SKUS_PATH + "/" + skuId + "/stock", OpenStockResponse.class);
    OpenStockResponse stock = result.data();
    if (stock == null) {
      throw new OmsCallException(0, "OMS 库存响应数据为空");
    }
    return new OmsStock(stock.skuId(), stock.skuNo(), stock.availableStock());
  }

  private static OmsOrderOutcome toOutcome(OpenOrderResponse response) {
    if (response == null) {
      throw new OmsCallException(0, "OMS 下单响应数据为空");
    }
    return new OmsOrderOutcome(
        response.orderNo(), response.status(), response.totalAmount(), response.currency());
  }

  private static OmsProduct toProduct(OpenSkuResponse response) {
    return new OmsProduct(
        response.skuId(),
        response.skuNo(),
        response.name(),
        response.price(),
        response.availableStock());
  }

  private static String urlEncode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
