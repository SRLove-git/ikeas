package com.ikea.server.service;

import com.ikea.server.constant.OrderConstants;
import com.ikea.server.dto.shipping.ShippingDtos.ShippingQuote;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** 商城配送报价的唯一来源。J&T 合同价变更时只需更新服务器配置。 */
@Service
public class ShippingService {

  private static final String PRICING_MODEL = "SERVER_CONFIGURED_JT_RATE";

  private final String carrier;
  private final String serviceCode;
  private final BigDecimal standardDeliveryFee;

  public ShippingService(
      @Value("${ikea.shipping.carrier:J&T Express Singapore}") String carrier,
      @Value("${ikea.shipping.service-code:EXPRESS}") String serviceCode,
      @Value("${ikea.shipping.standard-delivery-fee:4.90}") String standardDeliveryFee) {
    this.carrier = requireText(carrier, "配送承运商不能为空");
    this.serviceCode = requireText(serviceCode, "配送服务代码不能为空");
    this.standardDeliveryFee = normalizeFee(standardDeliveryFee);
  }

  public ShippingQuote quote() {
    return new ShippingQuote(
        carrier,
        serviceCode,
        OrderConstants.CURRENCY_SGD,
        standardDeliveryFee,
        PRICING_MODEL);
  }

  public BigDecimal standardDeliveryFee() {
    return standardDeliveryFee;
  }

  private static BigDecimal normalizeFee(String value) {
    try {
      BigDecimal fee = new BigDecimal(value).setScale(2, RoundingMode.HALF_UP);
      if (fee.signum() < 0) {
        throw new IllegalArgumentException("J&T 标准配送费不能为负数");
      }
      return fee;
    } catch (NumberFormatException ex) {
      throw new IllegalArgumentException("J&T 标准配送费配置无效", ex);
    }
  }

  private static String requireText(String value, String message) {
    if (value == null || value.isBlank()) {
      throw new IllegalArgumentException(message);
    }
    return value.trim();
  }
}
