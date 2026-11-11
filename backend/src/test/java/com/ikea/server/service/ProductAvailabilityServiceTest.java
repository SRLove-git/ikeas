package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsSkuMappingService;
import com.ikea.server.model.Product;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProductAvailabilityServiceTest {

  private OmsChannel channel;
  private OmsSkuMappingService mappings;
  private ProductAvailabilityService service;

  @BeforeEach
  void setUp() {
    channel = mock(OmsChannel.class);
    mappings = mock(OmsSkuMappingService.class);
    service = new ProductAvailabilityService(channel, mappings);
  }

  @Test
  void localCatalogProductIsSellableWhenOmsIsDisabled() {
    when(channel.isEnabled()).thenReturn(false);

    ProductAvailabilityService.Availability result =
        service.availability(product(new BigDecimal("199.00")));

    assertTrue(result.sellable());
    assertEquals(ProductAvailabilityService.AVAILABLE, result.reason());
  }

  @Test
  void omsRequiresSkuMappingBeforeCheckout() {
    when(channel.isEnabled()).thenReturn(true);

    ProductAvailabilityService.Availability result =
        service.availability(product(new BigDecimal("199.00")));

    assertFalse(result.sellable());
    assertEquals(ProductAvailabilityService.OMS_SKU_UNMAPPED, result.reason());
  }

  @Test
  void omsSnapshotControlsPriceAndStock() {
    when(channel.isEnabled()).thenReturn(true);
    OmsSkuMapping mapping = new OmsSkuMapping();
    mapping.setProductId("midea-demo");
    mapping.setOmsSkuId(1001L);
    mapping.setSyncPrice(new BigDecimal("188.00"));
    mapping.setSyncStock(0);
    when(mappings.getByProductId("midea-demo")).thenReturn(mapping);

    ProductAvailabilityService.Availability result =
        service.availability(product(new BigDecimal("199.00")));

    assertFalse(result.sellable());
    assertEquals(ProductAvailabilityService.OUT_OF_STOCK, result.reason());
    assertEquals(new BigDecimal("188.00"), result.price());
    assertEquals(0, result.stock());
  }

  private static Product product(BigDecimal price) {
    return new Product(
        "midea-demo",
        "demo",
        "Midea Demo",
        "Midea",
        "DEMO-1",
        price,
        null,
        null,
        List.of(),
        null,
        List.of("Midea"));
  }
}
