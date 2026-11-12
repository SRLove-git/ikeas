package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ikea.server.data.CartStore;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.order.CreateOrderItemRequest;
import com.ikea.server.dto.order.CreateOrderRequest;
import com.ikea.server.entity.Order;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsOrderSyncService;
import com.ikea.server.integration.oms.OmsProductSyncService;
import com.ikea.server.mapper.OrderItemMapper;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.model.Product;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class OrderServiceOmsPriceTest {

  @Test
  void enabledOmsRejectsOrderWhenAuthoritativePriceSnapshotIsMissing() {
    OrderMapper orderMapper = mock(OrderMapper.class);
    DataStore dataStore = mock(DataStore.class);
    OmsChannel omsChannel = mock(OmsChannel.class);
    OmsOrderSyncService orderSync = mock(OmsOrderSyncService.class);
    OmsProductSyncService productSync = mock(OmsProductSyncService.class);
    Product product =
        new Product(
            "P1",
            "product-1",
            "Product 1",
            "Medical",
            null,
            new BigDecimal("10.00"),
            null,
            null,
            List.of(),
            null,
            List.of());
    when(dataStore.findProductById("P1")).thenReturn(product);
    when(omsChannel.isEnabled()).thenReturn(true);
    when(orderSync.requireSkuMappings(any())).thenReturn(Map.of("P1", 1001L));
    when(productSync.priceFor(1001L)).thenReturn(null);

    OrderService service =
        new OrderService(
            orderMapper,
            mock(OrderItemMapper.class),
            dataStore,
            mock(CartStore.class),
            omsChannel,
            orderSync,
            productSync,
            mock(MarketingService.class),
            mock(ExperienceVoucherService.class),
            new ShippingService("J&T Express Singapore", "EXPRESS", "4.90"));
    CreateOrderRequest request =
        new CreateOrderRequest(
            List.of(new CreateOrderItemRequest("P1", 1)),
            false,
            null,
            "Test User",
            "81234567",
            "Singapore",
            "",
            null,
            null,
            null);

    assertThrows(IllegalArgumentException.class, () -> service.create(1L, request));
    verify(orderMapper, never()).insert(any(Order.class));
  }
}
