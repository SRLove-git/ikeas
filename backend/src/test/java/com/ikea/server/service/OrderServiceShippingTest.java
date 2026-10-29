package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
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
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class OrderServiceShippingTest {

  @Test
  void createShouldIgnoreClientDeliveryFeeAndUseServerJtRate() {
    OrderMapper orderMapper = mock(OrderMapper.class);
    OrderItemMapper orderItemMapper = mock(OrderItemMapper.class);
    DataStore dataStore = mock(DataStore.class);
    OmsChannel omsChannel = mock(OmsChannel.class);
    ShippingService shippingService =
        new ShippingService("J&T Express Singapore", "EXPRESS", "4.90");
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
    when(omsChannel.isEnabled()).thenReturn(false);
    when(orderMapper.insert(any(Order.class)))
        .thenAnswer(
            invocation -> {
              Order order = invocation.getArgument(0);
              order.setId(1L);
              order.setCreatedAt(LocalDateTime.now());
              order.setUpdatedAt(LocalDateTime.now());
              return 1;
            });

    OrderService service =
        new OrderService(
            orderMapper,
            orderItemMapper,
            dataStore,
            mock(CartStore.class),
            omsChannel,
            mock(OmsOrderSyncService.class),
            mock(OmsProductSyncService.class),
            mock(MarketingService.class),
            mock(ExperienceVoucherService.class),
            shippingService);
    CreateOrderRequest request =
        new CreateOrderRequest(
            List.of(new CreateOrderItemRequest("P1", 1)),
            false,
            new BigDecimal("0.01"),
            "Test User",
            "81234567",
            "Singapore",
            "",
            null,
            null,
            null);

    var response = service.create(null, request);

    assertEquals(new BigDecimal("4.90"), response.deliveryFee());
    assertEquals(new BigDecimal("14.90"), response.totalAmount());
  }
}
