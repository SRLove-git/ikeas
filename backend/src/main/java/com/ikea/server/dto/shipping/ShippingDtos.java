package com.ikea.server.dto.shipping;

import java.math.BigDecimal;

public final class ShippingDtos {

  private ShippingDtos() {}

  public record ShippingQuote(
      String carrier,
      String serviceCode,
      String currency,
      BigDecimal deliveryFee,
      String pricingModel) {}
}
