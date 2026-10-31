package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.payment.PaymentDtos.PaymentStatusResponse;
import com.ikea.server.entity.Order;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient.QueryOrderResult;
import com.ikea.server.integration.payment.yeahpay.YeahPayProperties;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.service.PaymentPersistenceService.PaymentAttempt;
import com.ikea.server.web.ResourceNotFoundException;
import com.ikea.server.web.UnauthorizedException;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 主动查单仅按渠道确认的交易结果推进订单，查不到或请求失败均不开放重复支付。 */
@Service
public class PaymentReconciliationService {

  private static final Logger log = LoggerFactory.getLogger(PaymentReconciliationService.class);
  private static final int QUERY_CACHE_SECONDS = 10;
  private static final int CHECKOUT_CREATION_GRACE_SECONDS = 60;
  private static final int ATTEMPT_PENDING = 0;
  private static final int ATTEMPT_SUCCEEDED = 1;
  private static final int ATTEMPT_FAILED = 2;
  private static final int PROVIDER_PENDING = 0;
  private static final int PROVIDER_PAID = 2;
  private static final int PROVIDER_CLOSED = 6;
  private static final int PROVIDER_FAILED = 8;

  private final OrderMapper orderMapper;
  private final OrderService orderService;
  private final YeahPayClient yeahPayClient;
  private final YeahPayProperties yeahPayProperties;
  private final PaymentPersistenceService persistence;

  public PaymentReconciliationService(
      OrderMapper orderMapper,
      OrderService orderService,
      YeahPayClient yeahPayClient,
      YeahPayProperties yeahPayProperties,
      PaymentPersistenceService persistence) {
    this.orderMapper = orderMapper;
    this.orderService = orderService;
    this.yeahPayClient = yeahPayClient;
    this.yeahPayProperties = yeahPayProperties;
    this.persistence = persistence;
  }

  @Transactional
  public PaymentStatusResponse refresh(Long userId, String orderNo) {
    if (userId == null) {
      throw new UnauthorizedException("请先登录");
    }
    Order order =
        orderMapper.selectOne(
            Wrappers.lambdaQuery(Order.class)
                .eq(Order::getOrderNo, orderNo)
                .eq(Order::getUserId, userId));
    if (order == null
        || !userId.equals(order.getUserId())
        || !orderNo.equals(order.getOrderNo())) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    OrderStatus status = OrderStatus.fromCode(order.getStatus());
    if (status == OrderStatus.PENDING_SHIPMENT
        || status == OrderStatus.PENDING_RECEIPT
        || status == OrderStatus.COMPLETED) {
      return result("paid", false);
    }
    if (status != OrderStatus.PENDING_PAYMENT) {
      return result("closed", false);
    }

    // 锁保持到本方法事务提交；查单、渠道回调和重试必须共享此会话锁。
    Optional<PaymentAttempt> reserved = persistence.findAttemptForUpdate(orderNo);
    if (reserved.isEmpty()) {
      return result("not_started", true);
    }
    PaymentAttempt attempt = reserved.get();
    if (!"yeahpay".equals(attempt.provider())) {
      return result("unavailable", false);
    }
    if (attempt.status() == ATTEMPT_SUCCEEDED) {
      return result("paid", false);
    }
    if (attempt.status() == ATTEMPT_FAILED) {
      return result("failed", true);
    }
    if (attempt.status() == ATTEMPT_PENDING
        && attempt.checkoutUrl() == null
        && attempt.createdAt() != null
        && !attempt.createdAt().isBefore(
            LocalDateTime.now(ZoneOffset.UTC).minusSeconds(CHECKOUT_CREATION_GRACE_SECONDS))) {
      // 创建中的新会话尚未返回地址，不能用渠道旧终态解锁它。
      return result("pending", false);
    }
    if (hasRecentQuery(attempt)) {
      String cached = attempt.queryStatus();
      if ("pending".equals(cached) || "unavailable".equals(cached)) {
        return result(cached, false);
      }
      // 查询缓存不能单独证明资金到账或允许新支付，必须以已提交的会话状态为准。
      return result("unknown", false);
    }
    if (!yeahPayClient.isConfigured()) {
      persistence.recordQueryResult(orderNo, "unavailable", "NOT_CONFIGURED", null);
      return result("unavailable", false);
    }

    QueryOrderResult query;
    try {
      query = yeahPayClient.queryOrder(providerOrderNo(attempt));
    } catch (RuntimeException ex) {
      // 仅捕获外部查单异常；持久化及结算在此 catch 之外，失败时由事务回滚。
      log.warn("支付查单不可用 orderNo={} errorType={}", orderNo, ex.getClass().getSimpleName());
      persistence.recordQueryResult(orderNo, "unavailable", "QUERY_ERROR", null);
      return result("unavailable", false);
    }
    if (!query.found()) {
      persistence.recordQueryResult(orderNo, "unknown", query.code(), query.traceId());
      return result("unknown", false);
    }

    boolean completeIdentity = validateOrderIdentity(order, attempt, query);
    Integer providerStatus = query.status();
    if (providerStatus == null || !completeIdentity) {
      persistence.recordQueryResult(orderNo, "unknown", query.code(), query.traceId());
      return result("unknown", false);
    }
    if (providerStatus == PROVIDER_PAID) {
      if (!hasText(query.transactionNo())) {
        throw new IllegalArgumentException("支付查询缺少渠道交易号");
      }
      persistence.recordSuccessfulTransaction(
          "yeahpay", orderNo, query.transactionNo(), query.amountMinor(), query.currency());
      persistence.markPaymentAttemptSucceeded(orderNo, "yeahpay");
      orderService.markPaidByGateway(
          orderNo,
          PaymentGatewayService.omsPaymentChannel(attempt.channel()),
          query.transactionNo(),
          query.thirdOrderId(),
          BigDecimal.valueOf(query.amountMinor(), 2),
          query.currency());
      persistence.recordQueryResult(orderNo, "paid", query.code(), query.traceId());
      return result("paid", false);
    }
    if (providerStatus == PROVIDER_CLOSED || providerStatus == PROVIDER_FAILED) {
      // 创建新的托管 URL 不代表渠道已生成新交易；旧失败交易不能释放新会话。
      if (!hasText(query.transactionNo())
          || persistence.findLastFailedTransactionNo(orderNo)
              .filter(query.transactionNo()::equals).isPresent()) {
        persistence.recordQueryResult(orderNo, "unknown", query.code(), query.traceId());
        return result("unknown", false);
      }
      String queriedStatus = providerStatus == PROVIDER_CLOSED ? "closed" : "failed";
      persistence.rememberFailedTransactionNo(orderNo, query.transactionNo());
      persistence.markPaymentAttemptFailed(orderNo, "yeahpay");
      persistence.recordQueryResult(orderNo, queriedStatus, query.code(), query.traceId());
      return result(queriedStatus, true);
    }
    String queriedStatus = providerStatus == PROVIDER_PENDING ? "pending" : "unknown";
    persistence.recordQueryResult(orderNo, queriedStatus, query.code(), query.traceId());
    return result(queriedStatus, false);
  }

  /** 查询允许部分字段缺省，但任何已返回的身份/金额都不得与商城订单冲突。 */
  private boolean validateOrderIdentity(
      Order order, PaymentAttempt attempt, QueryOrderResult query) {
    if (hasText(query.merchantId())
        && !query.merchantId().equals(yeahPayProperties.getMerchantId())) {
      throw new IllegalArgumentException("支付查询商户不匹配");
    }
    if (hasText(query.thirdOrderId())
        && !query.thirdOrderId().equals(providerOrderNo(attempt))) {
      throw new IllegalArgumentException("支付查询订单号不匹配");
    }
    if (hasText(query.currency()) && !query.currency().equalsIgnoreCase(order.getCurrency())) {
      throw new IllegalArgumentException("支付查询币种不匹配");
    }
    // YeahPay 文档金额单位为分；本商城订单固定使用 SGD，必须精确匹配，不做四舍五入。
    if (query.amountMinor() != null
        && (query.amountMinor() < 0
            || order.getTotalAmount() == null
            || BigDecimal.valueOf(query.amountMinor(), 2).compareTo(order.getTotalAmount()) != 0)) {
      throw new IllegalArgumentException("支付查询金额不匹配");
    }
    return hasText(query.merchantId())
        && hasText(query.thirdOrderId())
        && hasText(query.currency())
        && query.amountMinor() != null;
  }

  private static String providerOrderNo(PaymentAttempt attempt) {
    return hasText(attempt.providerOrderNo()) ? attempt.providerOrderNo() : attempt.orderNo();
  }

  private static boolean hasRecentQuery(PaymentAttempt attempt) {
    if (attempt.lastCheckedAt() == null) {
      return false;
    }
    long ageSeconds =
        Duration.between(attempt.lastCheckedAt(), LocalDateTime.now(ZoneOffset.UTC)).getSeconds();
    return ageSeconds >= 0 && ageSeconds < QUERY_CACHE_SECONDS;
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private static PaymentStatusResponse result(String status, boolean retryAllowed) {
    return new PaymentStatusResponse(status, retryAllowed);
  }
}
