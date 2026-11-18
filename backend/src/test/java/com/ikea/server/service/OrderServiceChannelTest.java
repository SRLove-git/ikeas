package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.AbstractWrapper;
import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.constant.SalesChannel;
import com.ikea.server.data.CartStore;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.marketing.MarketingDtos.RedemptionResponse;
import com.ikea.server.dto.order.CreateOrderItemRequest;
import com.ikea.server.dto.order.CreateOrderRequest;
import com.ikea.server.dto.order.OrderResponse;
import com.ikea.server.entity.Order;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsOrderSyncService;
import com.ikea.server.integration.oms.OmsProductSyncService;
import com.ikea.server.mapper.OrderItemMapper;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.model.Product;
import com.ikea.server.test.MybatisTestSupport;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OrderServiceChannelTest {

  private OrderMapper orderMapper;
  private DataStore dataStore;
  private MarketingService marketingService;
  private OrderService service;

  @BeforeEach
  void setUp() {
    MybatisTestSupport.initTableInfo(Order.class);
    orderMapper = mock(OrderMapper.class);
    dataStore = mock(DataStore.class);
    marketingService = mock(MarketingService.class);
    OmsChannel omsChannel = mock(OmsChannel.class);
    when(omsChannel.isEnabled()).thenReturn(false);
    when(marketingService.applyOrder(any(), any(), any(), any(), any(), any()))
        .thenReturn(
            new RedemptionResponse(
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
    when(orderMapper.insert(any(Order.class)))
        .thenAnswer(
            invocation -> {
              Order order = invocation.getArgument(0);
              order.setId(1L);
              order.setCreatedAt(LocalDateTime.now());
              order.setUpdatedAt(LocalDateTime.now());
              return 1;
            });
    service =
        new OrderService(
            orderMapper,
            mock(OrderItemMapper.class),
            dataStore,
            mock(CartStore.class),
            omsChannel,
            mock(OmsOrderSyncService.class),
            mock(OmsProductSyncService.class),
            marketingService,
            mock(ExperienceVoucherService.class),
            new ShippingService("J&T Express Singapore", "EXPRESS", "4.90"));
  }

  @Test
  void createShouldDeriveHomeChannelWhenEveryProductIsAnAppliance() {
    OrderResponse response =
        service.create(
            1L,
            request(
                List.of(
                    new CreateOrderItemRequest("midea-mx-100", 1),
                    new CreateOrderItemRequest("toshiba-tv-55", 1)),
                null));

    assertEquals(SalesChannel.HOME, response.salesChannel());
    assertEquals(SalesChannel.HOME, insertedOrder().getSalesChannel());
  }

  @Test
  void createShouldPreferAnExplicitSupportedSiteScope() {
    OrderResponse response =
        service.create(
            1L,
            request(List.of(new CreateOrderItemRequest("midea-mx-100", 1)), SalesChannel.MEDICAL));

    assertEquals(SalesChannel.MEDICAL, response.salesChannel());
    assertEquals(SalesChannel.MEDICAL, insertedOrder().getSalesChannel());
  }

  @Test
  void createShouldDeriveMedicalForMixedOrMedicalProducts() {
    OrderResponse mixed =
        service.create(
            1L,
            request(
                List.of(
                    new CreateOrderItemRequest("midea-mx-100", 1),
                    new CreateOrderItemRequest("8885020710595", 1)),
                null));
    assertEquals(SalesChannel.MEDICAL, mixed.salesChannel());

    OrderResponse medical =
        service.create(
            1L,
            request(List.of(new CreateOrderItemRequest("8885020710595", 1)), "portal"));
    assertEquals(SalesChannel.MEDICAL, medical.salesChannel());
  }

  @Test
  void listShouldApplyAnOptionalChannelFilter() {
    when(orderMapper.selectList(any())).thenReturn(List.of());

    service.list(1L, SalesChannel.HOME);

    AbstractWrapper<?, ?, ?> wrapper = capturedListWrapper();
    assertTrue(wrapper.getSqlSegment().contains("sales_channel"));
    assertTrue(wrapper.getParamNameValuePairs().containsValue(SalesChannel.HOME));
  }

  @Test
  void listWithoutChannelShouldReturnAllOrdersForThePortal() {
    when(orderMapper.selectList(any())).thenReturn(List.of());

    service.list(1L, null);

    AbstractWrapper<?, ?, ?> wrapper = capturedListWrapper();
    assertFalse(wrapper.getSqlSegment().contains("sales_channel"));
    assertFalse(wrapper.getParamNameValuePairs().containsValue(SalesChannel.HOME));
    assertFalse(wrapper.getParamNameValuePairs().containsValue(SalesChannel.MEDICAL));
  }

  @Test
  void listShouldRejectUnknownChannels() {
    assertThrows(IllegalArgumentException.class, () -> service.list(1L, "portal"));

    verify(orderMapper, never()).selectList(any());
  }

  private CreateOrderRequest request(List<CreateOrderItemRequest> items, String siteScope) {
    for (CreateOrderItemRequest item : items) {
      when(dataStore.findProductById(item.productId()))
          .thenReturn(product(item.productId()));
    }
    return new CreateOrderRequest(
        items,
        false,
        null,
        "Test User",
        "81234567",
        "Singapore",
        "",
        null,
        null,
        null,
        siteScope);
  }

  private static Product product(String id) {
    return new Product(
        id,
        id,
        "Product " + id,
        "Medical",
        null,
        new BigDecimal("10.00"),
        null,
        null,
        List.of(),
        null,
        List.of());
  }

  private Order insertedOrder() {
    ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
    verify(orderMapper).insert(captor.capture());
    return captor.getValue();
  }

  @SuppressWarnings("unchecked")
  private AbstractWrapper<?, ?, ?> capturedListWrapper() {
    ArgumentCaptor<Wrapper<Order>> captor = ArgumentCaptor.forClass(Wrapper.class);
    verify(orderMapper).selectList(captor.capture());
    return (AbstractWrapper<?, ?, ?>) captor.getValue();
  }
}
