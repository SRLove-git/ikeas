package com.ikea.server.integration.oms;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.OrderItem;
import com.ikea.server.entity.OmsOrderMapping;
import com.ikea.server.entity.OmsSkuMapping;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderOutcome;
import com.ikea.server.integration.oms.OmsChannel.OmsOrderInput.Line;
import com.ikea.server.mapper.OrderItemMapper;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.mapper.OmsOrderMappingMapper;
import com.ikea.server.mapper.OmsSkuMappingMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * OMS 订单同步服务（对接规范 §4.3 / §7）：
 *
 * <ul>
 *   <li>下单同步：本地优先，OMS 失败不回滚本地订单，标记待同步并退避重试；</li>
 *   <li>支付通知：先补单再通知（§4.3-3），成功后本地推进待发货；</li>
 *   <li>取消联动：仅已同步订单向 OMS 下发取消；</li>
 *   <li>状态轮询：OMS 状态回写本地，只允许推进不允许回退（§6.3）。</li>
 * </ul>
 */
@Service
public class OmsOrderSyncService {

  private static final Logger log = LoggerFactory.getLogger(OmsOrderSyncService.class);

  /** 同步状态：0 未同步 1 待同步 2 已同步 3 失败（人工处理）。 */
  public static final int SYNC_NONE = 0;
  public static final int SYNC_PENDING = 1;
  public static final int SYNC_DONE = 2;
  public static final int SYNC_FAILED = 3;

  /** 退避策略（秒）：5s / 30s / 5min / 30min。 */
  private static final long[] BACKOFF_SECONDS = {5, 30, 300, 1800};

  private final OmsChannel channel;
  private final OmsProperties properties;
  private final OrderMapper orderMapper;
  private final OrderItemMapper orderItemMapper;
  private final OmsSkuMappingMapper skuMappingMapper;
  private final OmsOrderMappingMapper orderMappingMapper;

  public OmsOrderSyncService(
      OmsChannel channel,
      OmsProperties properties,
      OrderMapper orderMapper,
      OrderItemMapper orderItemMapper,
      OmsSkuMappingMapper skuMappingMapper,
      OmsOrderMappingMapper orderMappingMapper) {
    this.channel = channel;
    this.properties = properties;
    this.orderMapper = orderMapper;
    this.orderItemMapper = orderItemMapper;
    this.skuMappingMapper = skuMappingMapper;
    this.orderMappingMapper = orderMappingMapper;
  }

  /**
   * 校验商品映射并返回 productId → skuId。任一商品未映射即拒绝下单（对接规范 §6.1 / 验收 T04）：
   * 商城侧拦截，不向 OMS 发出请求。
   */
  public Map<String, Long> requireSkuMappings(List<String> productIds) {
    List<OmsSkuMapping> mappings =
        skuMappingMapper.selectList(
            Wrappers.lambdaQuery(OmsSkuMapping.class).in(OmsSkuMapping::getProductId, productIds));
    Map<String, Long> byProduct =
        mappings.stream()
            .collect(Collectors.toMap(OmsSkuMapping::getProductId, OmsSkuMapping::getOmsSkuId));
    List<String> missing =
        productIds.stream().filter(id -> !byProduct.containsKey(id)).distinct().toList();
    if (!missing.isEmpty()) {
      log.error("订单包含未配置 OMS 映射的商品，拒绝下单 missing={}", missing);
      throw new IllegalArgumentException("商品未配置 OMS 映射: " + String.join(", ", missing));
    }
    return byProduct;
  }

  /**
   * 本地订单落库后同步 OMS。任何失败都不回滚本地订单（§4.3-1），
   * 标记待同步并按退避策略等待重试，超上限转失败人工处理。
   */
  public void syncCreate(Order order) {
    if (!channel.isEnabled()) {
      return;
    }
    OmsOrderMapping mapping = mappingFor(order.getOrderNo());
    if (mapping == null) {
      mapping = new OmsOrderMapping();
      mapping.setOrderNo(order.getOrderNo());
      mapping.setExternalOrderNo(order.getOrderNo());
      mapping.setSyncStatus(SYNC_PENDING);
      mapping.setRetryCount(0);
      orderMappingMapper.insert(mapping);
    }
    try {
      OmsOrderOutcome outcome = channel.createOrder(buildInput(order));
      mapping.setOmsOrderNo(outcome.omsOrderNo());
      mapping.setOmsStatus(outcome.status());
      mapping.setSyncStatus(SYNC_DONE);
      mapping.setLastError(null);
      mapping.setNextRetryAt(null);
      orderMappingMapper.updateById(mapping);
      log.info("OMS 下单同步成功 orderNo={} omsOrderNo={}", order.getOrderNo(), outcome.omsOrderNo());
    } catch (Exception ex) {
      int retryCount = mapping.getRetryCount() == null ? 1 : mapping.getRetryCount() + 1;
      mapping.setRetryCount(retryCount);
      mapping.setSyncStatus(retryCount > properties.getMaxRetries() ? SYNC_FAILED : SYNC_PENDING);
      mapping.setLastError(truncate(ex.getMessage()));
      mapping.setNextRetryAt(LocalDateTime.now().plusSeconds(backoffSeconds(retryCount)));
      orderMappingMapper.updateById(mapping);
      log.warn(
          "OMS 下单同步失败，本地订单照常成功 orderNo={} retry={} error={}",
          order.getOrderNo(), retryCount, ex.getMessage());
    }
  }

  /**
   * 支付成功通知（§7.2 / §4.3-3）：先确保 OMS 订单存在（未同步则补单），再通知；
   * 全部失败抛异常由调用方决定告警，本地订单不受影响。
   */
  public void notifyPaymentSuccess(
      String orderNo, String paymentNo, BigDecimal amount, String channelName) {
    if (!channel.isEnabled()) {
      throw new IllegalStateException("OMS 对接未启用，无法发送支付成功通知");
    }
    ensureOrderSynced(orderNo);
    channel.notifyPayment(orderNo, paymentNo, amount, channelName);

    Order order = requireOrder(orderNo);
    if (order.getStatus() != null && order.getStatus() == OrderStatus.PENDING_PAYMENT.code()) {
      order.setStatus(OrderStatus.PENDING_SHIPMENT.code());
      orderMapper.updateById(order);
    }
    OmsOrderMapping mapping = mappingFor(orderNo);
    if (mapping != null) {
      mapping.setOmsStatus(2);
      orderMappingMapper.updateById(mapping);
    }
  }

  /**
   * 本地取消联动（§7.3）：仅已同步订单向 OMS 下发取消；未同步订单不下发，
   * OMS 侧按超时策略自动取消。OMS 拒绝（如已支付）时本地取消结果不受影响。
   */
  public void cancelOrder(Order order) {
    if (!channel.isEnabled()) {
      return;
    }
    OmsOrderMapping mapping = mappingFor(order.getOrderNo());
    if (mapping == null || mapping.getSyncStatus() != SYNC_DONE || mapping.getOmsOrderNo() == null) {
      return;
    }
    try {
      channel.cancelOrder(order.getOrderNo());
      mapping.setOmsStatus(7);
      orderMappingMapper.updateById(mapping);
    } catch (OmsCallException ex) {
      log.warn(
          "OMS 取消失败，本地已取消，差异由对账/人工处理 orderNo={} error={}",
          order.getOrderNo(), ex.getMessage());
    }
  }

  /** 定时任务：重试待同步订单（§4.3-2）。对接关闭时直接跳过。 */
  @Scheduled(
      initialDelayString = "30000",
      fixedDelayString = "${ikea.oms.status-sync.interval-ms:5000}")
  public void syncPendingOrders() {
    if (!channel.isEnabled() || !properties.getStatusSync().isEnabled()) {
      return;
    }
    List<OmsOrderMapping> pending =
        orderMappingMapper.selectList(
            Wrappers.lambdaQuery(OmsOrderMapping.class)
                .eq(OmsOrderMapping::getSyncStatus, SYNC_PENDING)
                .and(
                    wrapper ->
                        wrapper
                            .isNull(OmsOrderMapping::getNextRetryAt)
                            .or()
                            .le(OmsOrderMapping::getNextRetryAt, LocalDateTime.now()))
                .last("LIMIT " + Math.max(1, properties.getStatusSync().getBatchSize())));
    for (OmsOrderMapping mapping : pending) {
      Order order = findOrder(mapping.getOrderNo());
      if (order == null) {
        continue;
      }
      // 本地已取消的未同步订单不再向 OMS 下发（§7.3）
      if (order.getStatus() != null && order.getStatus() == OrderStatus.CANCELLED.code()) {
        mapping.setSyncStatus(SYNC_NONE);
        orderMappingMapper.updateById(mapping);
        continue;
      }
      syncCreate(order);
    }
  }

  /** 定时任务：轮询 OMS 状态回写本地（§7.4，间隔 ≥ 5s）。 */
  @Scheduled(
      initialDelayString = "30000",
      fixedDelayString = "${ikea.oms.status-sync.interval-ms:5000}")
  public void pollOrderStatus() {
    if (!channel.isEnabled() || !properties.getStatusSync().isEnabled()) {
      return;
    }
    List<OmsOrderMapping> synced =
        orderMappingMapper.selectList(
            Wrappers.lambdaQuery(OmsOrderMapping.class)
                .eq(OmsOrderMapping::getSyncStatus, SYNC_DONE)
                .isNotNull(OmsOrderMapping::getOmsOrderNo)
                .last("LIMIT " + Math.max(1, properties.getStatusSync().getBatchSize())));
    for (OmsOrderMapping mapping : synced) {
      Order order = findOrder(mapping.getOrderNo());
      if (order == null || !OmsStatusMapping.isPollable(order.getStatus())) {
        continue;
      }
      try {
        OmsOrderOutcome outcome = channel.queryOrder(mapping.getExternalOrderNo());
        mapping.setOmsStatus(outcome.status());
        int target = OmsStatusMapping.toLocal(outcome.status());
        if (target == -1) {
          log.warn("OMS 未知订单状态，跳过 orderNo={} omsStatus={}", order.getOrderNo(), outcome.status());
        } else if (target > order.getStatus()) {
          int from = order.getStatus();
          order.setStatus(target);
          orderMapper.updateById(order);
          log.info("订单状态推进 orderNo={} from={} to={}", order.getOrderNo(), from, target);
        } else if (target < order.getStatus()) {
          // 只允许推进，不允许回退（§6.3）：记录差异，人工核对
          log.warn(
              "OMS 状态落后于本地，不覆盖，需人工核对 orderNo={} oms={} local={}",
              order.getOrderNo(), target, order.getStatus());
        }
        orderMappingMapper.updateById(mapping);
      } catch (OmsCallException ex) {
        log.warn("OMS 查单失败，等待下一轮 orderNo={} error={}", order.getOrderNo(), ex.getMessage());
      }
    }
  }

  /** 支付通知前置：确保 OMS 订单存在；不存在则补单（幂等），补单失败抛异常（§4.3-3）。 */
  private OmsOrderMapping ensureOrderSynced(String orderNo) {
    OmsOrderMapping mapping = mappingFor(orderNo);
    if (mapping != null && mapping.getSyncStatus() == SYNC_DONE && mapping.getOmsOrderNo() != null) {
      return mapping;
    }
    Order order = requireOrder(orderNo);
    OmsOrderOutcome outcome = channel.createOrder(buildInput(order));
    if (mapping == null) {
      mapping = new OmsOrderMapping();
      mapping.setOrderNo(orderNo);
      mapping.setExternalOrderNo(orderNo);
      mapping.setRetryCount(0);
      orderMappingMapper.insert(mapping);
    }
    mapping.setOmsOrderNo(outcome.omsOrderNo());
    mapping.setOmsStatus(outcome.status());
    mapping.setSyncStatus(SYNC_DONE);
    mapping.setLastError(null);
    mapping.setNextRetryAt(null);
    orderMappingMapper.updateById(mapping);
    return mapping;
  }

  private OmsOrderInput buildInput(Order order) {
    List<OrderItem> items =
        orderItemMapper.selectList(
            Wrappers.lambdaQuery(OrderItem.class).eq(OrderItem::getOrderId, order.getId()));
    List<Line> lines =
        items.stream()
            .map(item -> new Line(requireSkuId(item.getProductId()), item.getQuantity()))
            .toList();
    BigDecimal deliveryFee =
        order.getDeliveryFee() == null ? BigDecimal.ZERO : order.getDeliveryFee();
    return new OmsOrderInput(
        order.getOrderNo(),
        properties.getOrderType(),
        order.getRemark(),
        order.getCustomer(),
        order.getPhone(),
        order.getAddress(),
        deliveryFee,
        lines);
  }

  private Long requireSkuId(String productId) {
    OmsSkuMapping mapping =
        skuMappingMapper.selectOne(
            Wrappers.lambdaQuery(OmsSkuMapping.class).eq(OmsSkuMapping::getProductId, productId));
    if (mapping == null) {
      throw new IllegalStateException("商品未配置 OMS 映射: " + productId);
    }
    return mapping.getOmsSkuId();
  }

  private OmsOrderMapping mappingFor(String orderNo) {
    return orderMappingMapper.selectOne(
        Wrappers.lambdaQuery(OmsOrderMapping.class).eq(OmsOrderMapping::getOrderNo, orderNo));
  }

  private Order requireOrder(String orderNo) {
    Order order = findOrder(orderNo);
    if (order == null) {
      throw new IllegalStateException("本地订单不存在: " + orderNo);
    }
    return order;
  }

  private Order findOrder(String orderNo) {
    return orderMapper.selectOne(
        Wrappers.lambdaQuery(Order.class).eq(Order::getOrderNo, orderNo));
  }

  private static long backoffSeconds(int retryCount) {
    return BACKOFF_SECONDS[Math.min(Math.max(retryCount, 1), BACKOFF_SECONDS.length) - 1];
  }

  private static String truncate(String message) {
    if (message == null) {
      return null;
    }
    return message.length() <= 500 ? message : message.substring(0, 500);
  }
}
