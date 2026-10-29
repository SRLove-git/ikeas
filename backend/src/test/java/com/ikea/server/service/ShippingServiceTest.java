package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ShippingServiceTest {

  @Test
  void quoteShouldExposeConfiguredJtRate() {
    ShippingService service = new ShippingService("J&T Express Singapore", "EXPRESS", "4.90");

    var quote = service.quote();

    assertEquals("J&T Express Singapore", quote.carrier());
    assertEquals("EXPRESS", quote.serviceCode());
    assertEquals("SGD", quote.currency());
    assertEquals(new BigDecimal("4.90"), quote.deliveryFee());
    assertEquals(new BigDecimal("4.90"), service.standardDeliveryFee());
  }

  @Test
  void negativeRateShouldFailFast() {
    assertThrows(
        IllegalArgumentException.class,
        () -> new ShippingService("J&T Express Singapore", "EXPRESS", "-0.01"));
  }
}
