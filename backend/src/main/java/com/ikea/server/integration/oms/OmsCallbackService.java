package com.ikea.server.integration.oms;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.oms.OmsCallbackRequest;
import com.ikea.server.entity.Order;
import com.ikea.server.entity.OmsOrderMapping;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.mapper.OmsOrderMappingMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** 接收 OMS 主动推送的订单/售后状态，实时回写商城本地订单。 */
@Service
public class OmsCallbackService {

  private static final Logger log = LoggerFactory.getLogger(OmsCallbackService.class);

  private final OrderMapper orderMapper;
  private final OmsOrderMappingMapper mappingMapper;

  public OmsCallbackService(OrderMapper orderMapper, OmsOrderMappingMapper mappingMapper) {
    this.orderMapper = orderMapper;
    this.mappingMapper = mappingMapper;
  }

  public void handle(OmsCallbackRequest request) {
    Order order = resolveOrder(request);
    if (order == null) {
      log.warn("商城回调无法匹配本地订单 eventType={} orderNo={} externalOrderNo={}",
          request.eventType(), request.orderNo(), request.externalOrderNo());
      return;
    }
    Integer target = resolveTargetStatus(request);
    if (target == null || target.equals(order.getStatus())) {
      return;
    }
    int from = order.getStatus();
    order.setStatus(target);
    orderMapper.updateById(order);
    log.info("商城回调状态更新 orderNo={} eventType={} from={} to={}",
        order.getOrderNo(), request.eventType(), from, target);
  }

  private Order resolveOrder(OmsCallbackRequest request) {
    if (request.externalOrderNo() != null && !request.externalOrderNo().isBlank()) {
      return orderMapper.selectOne(Wrappers.lambdaQuery(Order.class)
          .eq(Order::getOrderNo, request.externalOrderNo()));
    }
    if (request.orderNo() != null && !request.orderNo().isBlank()) {
      OmsOrderMapping mapping = mappingMapper.findByOmsOrderNo(request.orderNo());
      if (mapping != null) {
        return orderMapper.selectOne(Wrappers.lambdaQuery(Order.class)
            .eq(Order::getOrderNo, mapping.getOrderNo()));
      }
    }
    return null;
  }

  private Integer resolveTargetStatus(OmsCallbackRequest request) {
    if ("aftersale.updated".equals(request.eventType())) {
      return switch (request.afterSaleStatus() == null ? -1 : request.afterSaleStatus()) {
        case 1, 2, 4, 5 -> OrderStatus.REFUNDING.code();
        case 3 -> OrderStatus.REFUND_REJECTED.code();
        case 6 -> OrderStatus.COMPLETED.code();
        case 7 -> OrderStatus.CANCELLED.code();
        default -> null;
      };
    }
    if (request.eventType() != null && request.eventType().startsWith("order.")) {
      return switch (request.status() == null ? -1 : request.status()) {
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
