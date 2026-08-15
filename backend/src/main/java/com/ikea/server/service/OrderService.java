package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.OrderConstants;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.data.CartStore;
import com.ikea.server.data.DataStore;
import com.ikea.server.dto.order.CreateOrderItemRequest;
import com.ikea.server.dto.order.CreateOrderRequest;
import com.ikea.server.dto.order.OrderItemResponse;
import com.ikea.server.dto.order.OrderResponse;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.OrderItem;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 订单业务：下单、查单、取消。 */
@Service
public class OrderService {

  private static final DateTimeFormatter ORDER_NO_TIME =
      DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS");

  private final OrderMapper orderMapper;
  private final OrderItemMapper orderItemMapper;
  private final DataStore dataStore;
  private final CartStore cartStore;
  private final BigDecimal defaultDeliveryFee;

  public OrderService(
      OrderMapper orderMapper,
      OrderItemMapper orderItemMapper,
      DataStore dataStore,
      CartStore cartStore,
      @Value("${ikea.order.default-delivery-fee:9.9}") String defaultDeliveryFee) {
    this.orderMapper = orderMapper;
    this.orderItemMapper = orderItemMapper;
    this.dataStore = dataStore;
    this.cartStore = cartStore;
    this.defaultDeliveryFee = new BigDecimal(defaultDeliveryFee);
  }

  @Transactional
  public OrderResponse create(Long userId, CreateOrderRequest request) {
    requireUser(userId);
    List<CreateOrderItemRequest> requestedItems = resolveItems(userId, request);
    List<OrderItem> orderItems = buildOrderItems(requestedItems);

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
    order.setCustomer(trimToNull(request.customer()));
    order.setPhone(trimToNull(request.phone()));
    order.setAddress(trimToNull(request.address()));
    order.setRemark(trimToNull(request.remark()));

    orderMapper.insert(order);
    for (OrderItem item : orderItems) {
      item.setOrderId(order.getId());
      orderItemMapper.insert(item);
    }

    if (request.fromCart() && (request.items() == null || request.items().isEmpty())) {
      cartStore.clear(String.valueOf(userId));
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
    List<OrderItemResponse> itemResponses =
        items.stream()
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
        itemResponses,
        order.getCreatedAt(),
        order.getUpdatedAt());
  }

  private String generateOrderNo() {
    return OrderConstants.ORDER_NO_PREFIX
        + LocalDateTime.now(ZoneOffset.UTC).format(ORDER_NO_TIME)
        + ThreadLocalRandom.current().nextInt(100000, 1000000);
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
