package com.ikea.server.integration.oms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.OrderItem;
import com.ikea.server.entity.OmsOrderMapping;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderOutcome;
import com.ikea.server.mapper.OrderItemMapper;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.mapper.OmsOrderMappingMapper;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * OMS 订单同步服务测试（对接规范 §4.3 / §6.3 / §7）：
 * 重点覆盖「本地优先降级」「先补单再通知」「只推进不回退」。
 */
class OmsOrderSyncServiceTest {

  private OmsChannel channel;
  private OmsProperties properties;
  private OrderMapper orderMapper;
  private OrderItemMapper orderItemMapper;
  private OmsSkuMappingMapper skuMappingMapper;
  private OmsOrderMappingMapper orderMappingMapper;
  private OmsOrderSyncService service;

  @BeforeEach
  void setUp() {
    channel = org.mockito.Mockito.mock(OmsChannel.class);
    properties = new OmsProperties();
    properties.setEnabled(true);
    properties.setOrderType(2);
    properties.setMaxRetries(3);
    orderMapper = org.mockito.Mockito.mock(OrderMapper.class);
    orderItemMapper = org.mockito.Mockito.mock(OrderItemMapper.class);
    skuMappingMapper = org.mockito.Mockito.mock(OmsSkuMappingMapper.class);
    orderMappingMapper = org.mockito.Mockito.mock(OmsOrderMappingMapper.class);
    service =
        new OmsOrderSyncService(
            channel,
            properties,
            orderMapper,
            orderItemMapper,
            skuMappingMapper,
            orderMappingMapper);
    when(channel.isEnabled()).thenReturn(true);
  }

  @Test
  void requireSkuMappingsShouldRejectMissingMapping() {
    when(skuMappingMapper.selectList(any(Wrapper.class)))
        .thenReturn(List.of(mapping("P1", 1001L)));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> service.requireSkuMappings(List.of("P1", "P2")));
    org.assertj.core.api.Assertions.assertThat(ex.getMessage()).contains("P2");
  }

  @Test
  void syncCreateShouldMarkPendingWithoutThrowingWhenOmsFails() {
    Order order = order(OrderStatus.PENDING_PAYMENT.code(), "B001");
    when(orderItemMapper.selectList(any(Wrapper.class))).thenReturn(List.of(orderItem("P1", 2)));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(mapping("P1", 1001L));
    when(orderMappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);
    when(channel.createOrder(any(OmsOrderInput.class)))
        .thenThrow(new OmsCallException(0, "OMS 网关不可达"));

    service.syncCreate(order);

    ArgumentCaptor<OmsOrderMapping> captor = ArgumentCaptor.forClass(OmsOrderMapping.class);
    verify(orderMappingMapper).insert(captor.capture());
    verify(orderMappingMapper).updateById(captor.capture());
    OmsOrderMapping saved = captor.getValue();
    assertEquals(OmsOrderSyncService.SYNC_PENDING, saved.getSyncStatus());
    assertEquals(1, saved.getRetryCount());
    assertNotNull(saved.getNextRetryAt());
  }

  @Test
  void syncCreateShouldMarkDoneOnSuccess() {
    Order order = order(OrderStatus.PENDING_PAYMENT.code(), "B002");
    when(orderItemMapper.selectList(any(Wrapper.class))).thenReturn(List.of(orderItem("P1", 2)));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(mapping("P1", 1001L));
    when(orderMappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);
    when(channel.createOrder(any(OmsOrderInput.class)))
        .thenReturn(new OmsOrderOutcome("O100", 1, new BigDecimal("109.90"), "SGD"));

    service.syncCreate(order);

    verify(channel).createOrder(any(OmsOrderInput.class));
    ArgumentCaptor<OmsOrderMapping> captor = ArgumentCaptor.forClass(OmsOrderMapping.class);
    verify(orderMappingMapper).updateById(captor.capture());
    assertEquals(OmsOrderSyncService.SYNC_DONE, captor.getValue().getSyncStatus());
    assertEquals("O100", captor.getValue().getOmsOrderNo());
  }

  @Test
  void notifyPaymentShouldCreateOrderFirstThenNotify() {
    Order order = order(OrderStatus.PENDING_PAYMENT.code(), "B003");
    when(orderItemMapper.selectList(any(Wrapper.class))).thenReturn(List.of(orderItem("P1", 2)));
    when(skuMappingMapper.selectOne(any(Wrapper.class))).thenReturn(mapping("P1", 1001L));
    // 映射不存在 → 前置补单（§4.3-3）
    when(orderMappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(channel.createOrder(any(OmsOrderInput.class)))
        .thenReturn(new OmsOrderOutcome("O101", 1, new BigDecimal("109.90"), "SGD"));

    service.notifyPaymentSuccess("B003", "MP001", new BigDecimal("109.90"), "wechat");

    verify(channel).createOrder(any(OmsOrderInput.class));
    verify(channel).notifyPayment("B003", "MP001", new BigDecimal("109.90"), "wechat");
    // 本地订单推进待发货
    assertEquals(OrderStatus.PENDING_SHIPMENT.code(), order.getStatus());
    verify(orderMapper).updateById(order);
  }

  @Test
  void notifyPaymentShouldSkipCreateWhenAlreadySynced() {
    Order order = order(OrderStatus.PENDING_PAYMENT.code(), "B004");
    OmsOrderMapping mapping = new OmsOrderMapping();
    mapping.setOrderNo("B004");
    mapping.setExternalOrderNo("B004");
    mapping.setOmsOrderNo("O102");
    mapping.setSyncStatus(OmsOrderSyncService.SYNC_DONE);
    when(orderMappingMapper.selectOne(any(Wrapper.class))).thenReturn(mapping);
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);

    service.notifyPaymentSuccess("B004", "MP002", new BigDecimal("109.90"), "alipay");

    verify(channel, never()).createOrder(any(OmsOrderInput.class));
    verify(channel).notifyPayment("B004", "MP002", new BigDecimal("109.90"), "alipay");
    assertEquals(OrderStatus.PENDING_SHIPMENT.code(), order.getStatus());
  }

  @Test
  void pollShouldAdvanceLocalStatusForwardOnly() {
    Order order = order(OrderStatus.PENDING_PAYMENT.code(), "B005");
    OmsOrderMapping mapping = syncedMapping("B005", "O103", 1);
    when(orderMappingMapper.selectList(any(Wrapper.class))).thenReturn(List.of(mapping));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    // OMS 已发货（4）→ 本地待收货（3）
    when(channel.queryOrder("B005"))
        .thenReturn(new OmsOrderOutcome("O103", 4, new BigDecimal("109.90"), "SGD"));

    service.pollOrderStatus();

    assertEquals(OrderStatus.PENDING_RECEIPT.code(), order.getStatus());
    verify(orderMapper).updateById(order);
    assertEquals(4, mapping.getOmsStatus());
  }

  @Test
  void pollShouldNotRegressLocalStatus() {
    Order order = order(OrderStatus.PENDING_RECEIPT.code(), "B006");
    OmsOrderMapping mapping = syncedMapping("B006", "O104", 4);
    when(orderMappingMapper.selectList(any(Wrapper.class))).thenReturn(List.of(mapping));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    // OMS 状态（2）小于本地（3）：只记录差异，不覆盖（§6.3）
    when(channel.queryOrder("B006"))
        .thenReturn(new OmsOrderOutcome("O104", 2, new BigDecimal("109.90"), "SGD"));

    service.pollOrderStatus();

    assertEquals(OrderStatus.PENDING_RECEIPT.code(), order.getStatus());
    verify(orderMapper, never()).updateById(any(Order.class));
  }

  @Test
  void cancelShouldNotCallOmsWhenNotSynced() {
    Order order = order(OrderStatus.CANCELLED.code(), "B007");
    when(orderMappingMapper.selectOne(any(Wrapper.class))).thenReturn(null);

    service.cancelOrder(order);

    verify(channel, never()).cancelOrder(any(String.class));
  }

  @Test
  void cancelShouldCallOmsWhenSynced() {
    Order order = order(OrderStatus.CANCELLED.code(), "B008");
    when(orderMappingMapper.selectOne(any(Wrapper.class))).thenReturn(syncedMapping("B008", "O105", 1));

    service.cancelOrder(order);

    verify(channel).cancelOrder("B008");
  }

  private static Order order(int status, String orderNo) {
    Order order = new Order();
    order.setId(1L);
    order.setOrderNo(orderNo);
    order.setUserId(1L);
    order.setStatus(status);
    order.setCurrency("SGD");
    order.setDeliveryFee(new BigDecimal("9.90"));
    order.setCustomer("张三");
    order.setPhone("+65 8123 4567");
    order.setAddress("新加坡示例路 1 号");
    return order;
  }

  private static OrderItem orderItem(String productId, int quantity) {
    OrderItem item = new OrderItem();
    item.setOrderId(1L);
    item.setProductId(productId);
    item.setProductName("商品");
    item.setQuantity(quantity);
    return item;
  }

  private static OmsSkuMapping mapping(String productId, Long skuId) {
    OmsSkuMapping mapping = new OmsSkuMapping();
    mapping.setProductId(productId);
    mapping.setOmsSkuId(skuId);
    return mapping;
  }

  private static OmsOrderMapping syncedMapping(String orderNo, String omsOrderNo, int omsStatus) {
    OmsOrderMapping mapping = new OmsOrderMapping();
    mapping.setOrderNo(orderNo);
    mapping.setExternalOrderNo(orderNo);
    mapping.setOmsOrderNo(omsOrderNo);
    mapping.setOmsStatus(omsStatus);
    mapping.setSyncStatus(OmsOrderSyncService.SYNC_DONE);
    return mapping;
  }
}
