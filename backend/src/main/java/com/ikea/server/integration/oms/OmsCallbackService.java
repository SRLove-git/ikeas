package com.ikea.server.integration.oms;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.oms.OmsCallbackRequest;
import com.ikea.server.dto.oms.OmsCallbackRequest.OmsCallbackData;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.OmsOrderMapping;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.mapper.OmsOrderMappingMapper;
import com.ikea.server.service.FulfillmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** 接收 OMS 主动推送的订单/售后状态，实时回写商城本地订单。 */
@Service
public class OmsCallbackService {

  private static final Logger log = LoggerFactory.getLogger(OmsCallbackService.class);

  private final OrderMapper orderMapper;
  private final OmsOrderMappingMapper mappingMapper;
  private final FulfillmentService fulfillmentService;

  public OmsCallbackService(
      OrderMapper orderMapper,
      OmsOrderMappingMapper mappingMapper,
      FulfillmentService fulfillmentService) {
    this.orderMapper = orderMapper;
    this.mappingMapper = mappingMapper;
    this.fulfillmentService = fulfillmentService;
  }

  public void handle(OmsCallbackRequest request) {
    OmsCallbackData data = request.data();
    if (data == null) {
      log.warn("商城回调缺少 data 字段 eventId={} event={}", request.eventId(), request.event());
      return;
    }

    if (hasText(data.carrier())
        || hasText(data.trackingNo())
        || hasText(data.logisticsStatus())
        || hasText(data.trace())) {
      Order logisticsOrder = resolveOrder(data);
      if (logisticsOrder != null) {
        fulfillmentService.upsertLogistics(
            logisticsOrder.getOrderNo(),
            data.carrier(),
            data.trackingNo(),
            data.logisticsStatus(),
            data.trace());
      }
    }

    if ("aftersale.updated".equals(request.event())) {
      Order afterSaleOrder = resolveOrder(data);
      if (afterSaleOrder != null) {
        fulfillmentService.syncAfterSaleStatus(
            afterSaleOrder.getOrderNo(), data.omsReturnNo(), data.afterSaleStatus());
      }
    }

    Order order = resolveOrder(data);
    if (order == null) {
      log.warn(
          "商城回调无法匹配本地订单 eventId={} event={} orderNo={} externalOrderNo={}",
          request.eventId(),
          request.event(),
          data.orderNo(),
          data.externalOrderNo());
      return;
    }

    Integer target = resolveTargetStatus(request.event(), data);
    if (target == null || target.equals(order.getStatus())) {
      return;
    }
    int from = order.getStatus();
    order.setStatus(target);
    orderMapper.updateById(order);
    log.info(
        "商城回调状态更新 orderNo={} eventId={} event={} from={} to={}",
        order.getOrderNo(),
        request.eventId(),
        request.event(),
        from,
        target);
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private Order resolveOrder(OmsCallbackData data) {
    if (data.externalOrderNo() != null && !data.externalOrderNo().isBlank()) {
      return orderMapper.selectOne(
          Wrappers.lambdaQuery(Order.class)
              .eq(Order::getOrderNo, data.externalOrderNo()));
    }
    if (data.orderNo() != null && !data.orderNo().isBlank()) {
      OmsOrderMapping mapping = mappingMapper.findByOmsOrderNo(data.orderNo());
      if (mapping != null) {
        return orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getOrderNo, mapping.getOrderNo()));
      }
    }
    return null;
  }

  private Integer resolveTargetStatus(String eventType, OmsCallbackData data) {
    if ("aftersale.updated".equals(eventType)) {
      return switch (data.afterSaleStatus() == null ? -1 : data.afterSaleStatus()) {
        case 1, 2, 4, 5 -> OrderStatus.REFUNDING.code();
        case 3 -> OrderStatus.REFUND_REJECTED.code();
        case 6 -> OrderStatus.COMPLETED.code();
        case 7 -> OrderStatus.CANCELLED.code();
        default -> null;
      };
    }
    if (eventType != null && eventType.startsWith("order.")) {
      return switch (data.status() == null ? -1 : data.status()) {
        case 4, 5 -> OrderStatus.PENDING_RECEIPT.code();
        case 6 -> OrderStatus.COMPLETED.code();
        case 7 -> OrderStatus.CANCELLED.code();
        case 8 -> OrderStatus.REFUNDING.code();
        default -> null;
      };
    }
    return null;
  }
}
