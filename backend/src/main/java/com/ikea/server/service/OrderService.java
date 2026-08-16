package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.OrderConstants;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.data.CartStore;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.order.AdminOrderRow;
import com.ikea.server.dto.order.AdminOrderUpdateRequest;
import com.ikea.server.dto.order.CreateOrderItemRequest;
import com.ikea.server.dto.order.CreateOrderRequest;
import com.ikea.server.dto.order.OrderItemResponse;
import com.ikea.server.dto.order.OrderResponse;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.OrderItem;
import com.ikea.server.integration.oms.OmsChannel;
import com.ikea.server.integration.oms.OmsOrderSyncService;
import com.ikea.server.integration.oms.OmsProductSyncService;
import com.ikea.server.mapper.OrderItemMapper;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.model.Product;
import com.ikea.server.web.ResourceNotFoundException;
import com.ikea.server.web.UnauthorizedException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 订单业务：下单、查单、取消。对接 OMS 时按对接规范 §7 同步/取消联动。 */
@Service
public class OrderService {

  private static final Logger log = LoggerFactory.getLogger(OrderService.class);

  private static final DateTimeFormatter ORDER_NO_TIME =
      DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

  private final OrderMapper orderMapper;
  private final OrderItemMapper orderItemMapper;
  private final DataStore dataStore;
  private final CartStore cartStore;
  private final OmsChannel omsChannel;
  private final OmsOrderSyncService omsOrderSyncService;
  private final OmsProductSyncService omsProductSyncService;
  private final BigDecimal defaultDeliveryFee;

  public OrderService(
      OrderMapper orderMapper,
      OrderItemMapper orderItemMapper,
      DataStore dataStore,
      CartStore cartStore,
      OmsChannel omsChannel,
      OmsOrderSyncService omsOrderSyncService,
      OmsProductSyncService omsProductSyncService,
      @Value("${ikea.order.default-delivery-fee:9.9}") String defaultDeliveryFee) {
    this.orderMapper = orderMapper;
    this.orderItemMapper = orderItemMapper;
    this.dataStore = dataStore;
    this.cartStore = cartStore;
    this.omsChannel = omsChannel;
    this.omsOrderSyncService = omsOrderSyncService;
    this.omsProductSyncService = omsProductSyncService;
    this.defaultDeliveryFee = new BigDecimal(defaultDeliveryFee);
  }

  @Transactional
  public OrderResponse create(Long userId, CreateOrderRequest request) {
    requireUser(userId);
    List<CreateOrderItemRequest> requestedItems = resolveItems(userId, request);
    List<OrderItem> orderItems = buildOrderItems(requestedItems);

    // 对接开启时前置校验商品映射与可售库存（对接规范 §6.1 / §4.2 / 验收 T04）
    if (omsChannel.isEnabled()) {
      Map<String, Long> skuByProduct = omsOrderSyncService.requireSkuMappings(
          orderItems.stream().map(OrderItem::getProductId).distinct().toList());
      List<OmsChannel.OmsOrderInput.Line> lines =
          orderItems.stream()
              .map(
                  item ->
                      new OmsChannel.OmsOrderInput.Line(
                          skuByProduct.get(item.getProductId()), item.getQuantity()))
              .toList();
      omsProductSyncService.ensureStockAvailable(lines);
    }

    BigDecimal subtotal =
        orderItems.stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal deliveryFee = resolveDeliveryFee(request.deliveryFee());
    BigDecimal totalAmount = subtotal.add(deliveryFee);

    Order order = new Order();
    order.setOrderNo(generateOrderNo());
    order.setUserId(userId);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency(OrderConstants.CURRENCY_SGD);
    order.setSubtotal(normalizeMoney(subtotal));
    order.setDeliveryFee(normalizeMoney(deliveryFee));
    order.setTotalAmount(normalizeMoney(totalAmount));
    if (request.customer() != null) {
      order.setCustomer(trimToNull(request.customer()));
    }
    if (request.phone() != null) {
      order.setPhone(trimToNull(request.phone()));
    }
    if (request.address() != null) {
      order.setAddress(trimToNull(request.address()));
    }
    if (request.remark() != null) {
      order.setRemark(trimToNull(request.remark()));
    }

    orderMapper.insert(order);
    for (OrderItem item : orderItems) {
      item.setOrderId(order.getId());
      orderItemMapper.insert(item);
    }

    if (request.fromCart() && (request.items() == null || request.items().isEmpty())) {
      cartStore.clear(String.valueOf(userId));
    }

    // 本地订单已落库，OMS 同步失败不回滚本地订单（对接规范 §4.3-1）
    if (omsChannel.isEnabled()) {
      try {
        omsOrderSyncService.syncCreate(order);
      } catch (Exception ex) {
        log.warn("OMS 下单同步异常，本地订单照常成功 orderNo={}", order.getOrderNo(), ex);
      }
    }

    return toResponse(order, orderItems);
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> list(Long userId) {
    requireUser(userId);
    List<Order> orders =
        orderMapper.selectList(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getUserId, userId)
                .orderByDesc(Order::getCreatedAt));
    if (orders.isEmpty()) {
      return List.of();
    }

    List<Long> orderIds = orders.stream().map(Order::getId).toList();
    List<OrderItem> items =
        orderItemMapper.selectList(
            Wrappers.lambdaQuery(OrderItem.class).in(OrderItem::getOrderId, orderIds));
    Map<Long, List<OrderItem>> itemsByOrder = groupItems(items);

    return orders.stream()
        .map(order -> toResponse(order, itemsByOrder.getOrDefault(order.getId(), List.of())))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AdminOrderRow> listAdmin() {
    List<Order> orders =
        orderMapper.selectList(
            Wrappers.lambdaQuery(Order.class).orderByDesc(Order::getCreatedAt));
    if (orders.isEmpty()) {
      return List.of();
    }

    List<Long> orderIds = orders.stream().map(Order::getId).toList();
    List<OrderItem> items =
        orderItemMapper.selectList(
            Wrappers.lambdaQuery(OrderItem.class).in(OrderItem::getOrderId, orderIds));
    Map<Long, List<OrderItem>> itemsByOrder = groupItems(items);

    return orders.stream()
        .map(order -> toAdminRow(order, itemsByOrder.getOrDefault(order.getId(), List.of())))
        .toList();
  }

  @Transactional(readOnly = true)
  public AdminOrderRow getAdmin(String orderNo) {
    Order order = requireOrderAdmin(orderNo);
    return toAdminRow(order, itemsOf(order.getId()));
  }

  @Transactional
  public AdminOrderRow updateAdmin(String orderNo, AdminOrderUpdateRequest request) {
    Order order = requireOrderAdmin(orderNo);
    if (request.status() != null) {
      if (OrderStatus.fromCode(request.status()) == null) {
        throw new IllegalArgumentException("订单状态无效");
      }
      order.setStatus(request.status());
    }
    if (request.deliveryFee() != null) {
      if (request.deliveryFee().compareTo(BigDecimal.ZERO) < 0) {
        throw new IllegalArgumentException("配送费不能为负数");
      }
      order.setDeliveryFee(normalizeMoney(request.deliveryFee()));
    }
    if (request.customer() != null) {
      order.setCustomer(trimToNull(request.customer()));
    }
    if (request.phone() != null) {
      order.setPhone(trimToNull(request.phone()));
    }
    if (request.address() != null) {
      order.setAddress(trimToNull(request.address()));
    }
    if (request.remark() != null) {
      order.setRemark(trimToNull(request.remark()));
    }
    orderMapper.updateById(order);
    return toAdminRow(order, itemsOf(order.getId()));
  }

  @Transactional
  public boolean softDeleteAdmin(String orderNo) {
    Order order = requireOrderAdmin(orderNo);
    for (OrderItem item : itemsOf(order.getId())) {
      orderItemMapper.deleteById(item.getId());
    }
    return orderMapper.deleteById(order.getId()) > 0;
  }

  @Transactional(readOnly = true)
  public OrderResponse get(Long userId, String orderNo) {
    requireUser(userId);
    Order order =
        orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getUserId, userId)
                .eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    return toResponse(order, itemsOf(order.getId()));
  }

  @Transactional
  public OrderResponse cancel(Long userId, String orderNo) {
    requireUser(userId);
    Order order =
        orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getUserId, userId)
                .eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    if (order.getStatus() != OrderStatus.PENDING_PAYMENT.code()) {
      throw new IllegalArgumentException("仅待付款订单可以取消");
    }
    order.setStatus(OrderStatus.CANCELLED.code());
    orderMapper.updateById(order);

    // 已同步订单向 OMS 下发取消（对接规范 §7.3），失败不影响本地取消结果
    if (omsChannel.isEnabled()) {
      try {
        omsOrderSyncService.cancelOrder(order);
      } catch (Exception ex) {
        log.warn("OMS 取消联动异常，本地已取消 orderNo={}", order.getOrderNo(), ex);
      }
    }

    return toResponse(order, itemsOf(order.getId()));
  }

  /**
   * 模拟支付：待付款 → 待发货。对接开启时同时向 OMS 发送支付成功通知
   * （对接规范 §7.2）；未对接时仅推进本地状态。
   */
  @Transactional
  public OrderResponse pay(Long userId, String orderNo) {
    requireUser(userId);
    Order order =
        orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getUserId, userId)
                .eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    if (order.getStatus() != OrderStatus.PENDING_PAYMENT.code()) {
      throw new IllegalArgumentException("仅待付款订单可以支付");
    }

    if (omsChannel.isEnabled()) {
      omsOrderSyncService.notifyPaymentSuccess(
          orderNo, generatePaymentNo(), order.getTotalAmount(), "mock");
      order =
          orderMapper.selectOne(
              Wrappers.lambdaQuery(Order.class).eq(Order::getOrderNo, orderNo));
    } else {
      order.setStatus(OrderStatus.PENDING_SHIPMENT.code());
      orderMapper.updateById(order);
    }
    return toResponse(order, itemsOf(order.getId()));
  }

  /**
   * 申请退款：已支付、待收货或已完成订单 → 退款中。当前版本先在本地记录状态，
   * 供客服/管理后台跟进；OMS 开放 API 尚未提供退款联动接口，后续接入时再补齐。
   */
  @Transactional
  public OrderResponse refund(Long userId, String orderNo) {
    requireUser(userId);
    Order order =
        orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getUserId, userId)
                .eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    boolean refundable =
        order.getStatus() != null
            && (order.getStatus() == OrderStatus.PENDING_SHIPMENT.code()
                || order.getStatus() == OrderStatus.PENDING_RECEIPT.code()
                || order.getStatus() == OrderStatus.COMPLETED.code());
    if (!refundable) {
      throw new IllegalArgumentException("仅已支付、待收货或已完成订单可申请退款");
    }

    order.setStatus(OrderStatus.REFUNDING.code());
    orderMapper.updateById(order);

    if (omsChannel.isEnabled()) {
      try {
        omsOrderSyncService.requestRefund(order);
      } catch (Exception ex) {
        log.warn(
            "OMS 退款申请同步失败，本地退款状态已记录 orderNo={} error={}",
            order.getOrderNo(),
            ex.getMessage());
      }
    }

    return toResponse(order, itemsOf(order.getId()));
  }

  private List<CreateOrderItemRequest> resolveItems(Long userId, CreateOrderRequest request) {
    if (request.items() != null && !request.items().isEmpty()) {
      return request.items();
    }
    if (request.fromCart()) {
      List<CreateOrderItemRequest> items = new ArrayList<>();
      cartStore
          .cartFor(String.valueOf(userId))
          .forEach(
              (productId, entry) ->
                  items.add(new CreateOrderItemRequest(productId, entry.quantity())));
      if (items.isEmpty()) {
        throw new IllegalArgumentException("购物袋为空，无法下单");
      }
      return items;
    }
    throw new IllegalArgumentException("请提供下单商品或从购物袋下单");
  }

  private List<OrderItem> buildOrderItems(List<CreateOrderItemRequest> requestedItems) {
    List<OrderItem> items = new ArrayList<>();
    for (CreateOrderItemRequest requestedItem : requestedItems) {
      Product product = dataStore.findProductById(requestedItem.productId());
      if (product == null) {
        throw new ResourceNotFoundException("Product not found: " + requestedItem.productId());
      }
      int quantity =
          Math.max(
              1,
              Math.min(
                  OrderConstants.MAX_ITEM_QUANTITY,
                  requestedItem.quantity() == null ? 1 : requestedItem.quantity()));
      BigDecimal unitPrice =
          product.price() == null ? BigDecimal.ZERO : product.price();

      OrderItem item = new OrderItem();
      item.setProductId(product.id());
      item.setProductName(product.name() == null ? product.id() : product.name());
      item.setImage(product.image());
      item.setUnitPrice(normalizeMoney(unitPrice));
      item.setQuantity(quantity);
      items.add(item);
    }
    return items;
  }

  private BigDecimal resolveDeliveryFee(BigDecimal deliveryFee) {
    if (deliveryFee == null) {
      return defaultDeliveryFee == null ? BigDecimal.valueOf(9.9) : defaultDeliveryFee;
    }
    if (deliveryFee.compareTo(BigDecimal.ZERO) < 0) {
      throw new IllegalArgumentException("配送费不能为负数");
    }
    return deliveryFee;
  }

  private List<OrderItem> itemsOf(Long orderId) {
    return orderItemMapper.selectList(
        Wrappers.lambdaQuery(OrderItem.class).eq(OrderItem::getOrderId, orderId));
  }

  private Map<Long, List<OrderItem>> groupItems(List<OrderItem> items) {
    Map<Long, List<OrderItem>> grouped = new LinkedHashMap<>();
    for (OrderItem item : items) {
      grouped.computeIfAbsent(item.getOrderId(), ignored -> new ArrayList<>()).add(item);
    }
    return grouped;
  }

  private OrderResponse toResponse(Order order, List<OrderItem> items) {
    OrderStatus status = OrderStatus.fromCode(order.getStatus());

    return new OrderResponse(
        order.getId(),
        order.getOrderNo(),
        order.getStatus(),
        status == null ? "未知" : status.label(),
        order.getCurrency(),
        normalizeMoney(order.getSubtotal()),
        normalizeMoney(order.getDeliveryFee()),
        normalizeMoney(order.getTotalAmount()),
        order.getCustomer(),
        order.getPhone(),
        order.getAddress(),
        order.getRemark(),
        toItemResponses(items),
        order.getCreatedAt(),
        order.getUpdatedAt());
  }

  private AdminOrderRow toAdminRow(Order order, List<OrderItem> items) {
    OrderStatus status = OrderStatus.fromCode(order.getStatus());
    return new AdminOrderRow(
        order.getId(),
        order.getOrderNo(),
        order.getUserId(),
        order.getStatus(),
        status == null ? "未知" : status.label(),
        order.getCurrency(),
        normalizeMoney(order.getSubtotal()),
        normalizeMoney(order.getDeliveryFee()),
        normalizeMoney(order.getTotalAmount()),
        order.getCustomer(),
        order.getPhone(),
        order.getAddress(),
        order.getRemark(),
        toItemResponses(items),
        order.getCreatedAt(),
        order.getUpdatedAt());
  }

  private List<OrderItemResponse> toItemResponses(List<OrderItem> items) {
    return items.stream()
        .map(
            item ->
                new OrderItemResponse(
                    item.getProductId(),
                    item.getProductName(),
                    item.getImage(),
                    normalizeMoney(item.getUnitPrice()),
                    item.getQuantity(),
                    normalizeMoney(
                        item.getUnitPrice()
                            .multiply(BigDecimal.valueOf(item.getQuantity())))))
        .toList();
  }

  private String generateOrderNo() {
    return OrderConstants.ORDER_NO_PREFIX
        + LocalDateTime.now(ZoneOffset.UTC).format(ORDER_NO_TIME)
        + ThreadLocalRandom.current().nextInt(100000, 1000000);
  }

  private String generatePaymentNo() {
    return "MP"
        + LocalDateTime.now(ZoneOffset.UTC).format(ORDER_NO_TIME)
        + ThreadLocalRandom.current().nextInt(100000, 1000000);
  }

  private Order requireOrderAdmin(String orderNo) {
    Order order =
        orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class).eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    return order;
  }

  private static BigDecimal normalizeMoney(BigDecimal value) {
    if (value == null) {
      return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }
    return value.setScale(2, RoundingMode.HALF_UP);
  }

  private static String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private static void requireUser(Long userId) {
    if (userId == null) {
      throw new UnauthorizedException("请先登录");
    }
  }
}
