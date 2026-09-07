package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.payment.PaymentDtos.CreatePaymentResponse;
import com.ikea.server.dto.payment.PaymentDtos.PaymentOptions;
import com.ikea.server.entity.Order;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.web.ResourceNotFoundException;
import com.ikea.server.web.UnauthorizedException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 商城收银台：真实模式下使用 Stripe 托管结算页（Visa/Mastercard 等国际卡），
 * 未配置密钥或 mock-only=true 时保留本地模拟支付，保证演示链路可跑。
 */
@Service
public class PaymentGatewayService {

  private static final Logger log = LoggerFactory.getLogger(PaymentGatewayService.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final int WEBHOOK_REPLAY_WINDOW_SECONDS = 300;
  private static final Set<String> ZERO_DECIMAL_CURRENCIES = Set.of(
      "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG",
      "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF");
  private static final Set<String> THREE_DECIMAL_CURRENCIES = Set.of("BHD", "JOD", "KWD", "OMR", "TND");

  private final OrderMapper orderMapper;
  private final OrderService orderService;
  private final HttpClient httpClient = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(10))
      .build();

  @Value("${ikea.payment.mock-only:true}")
  private boolean mockOnly;

  @Value("${ikea.payment.stripe.public-key:}")
  private String stripePublicKey;

  @Value("${ikea.payment.stripe.secret-key:}")
  private String stripeSecretKey;

  @Value("${ikea.payment.stripe.webhook-secret:}")
  private String stripeWebhookSecret;

  @Value("${ikea.payment.stripe.api-base-url:https://api.stripe.com}")
  private String stripeApiBaseUrl;

  @Value("${ikea.payment.stripe.return-url-base:http://localhost:3000}")
  private String returnUrlBase;

  @Value("${ikea.payment.stripe.success-path:/zh/profile/my-orders?payment=success}")
  private String successPath;

  @Value("${ikea.payment.stripe.cancel-path:/zh/pay/cart?payment=cancel}")
  private String cancelPath;

  public PaymentGatewayService(OrderMapper orderMapper, OrderService orderService) {
    this.orderMapper = orderMapper;
    this.orderService = orderService;
  }

  public PaymentOptions options() {
    return new PaymentOptions(mockOnly, stripePublicKey);
  }

  public CreatePaymentResponse createPayment(String orderNo, String channel) {
    Order order = requirePendingOrder(orderNo);
    if (mockOnly) {
      return new CreatePaymentResponse(true, "mock", null);
    }

    String normalized = channel == null || channel.isBlank() ? "card" : channel.toLowerCase();
    if (!Set.of("card", "visa", "mastercard").contains(normalized)) {
      throw new IllegalArgumentException("当前商城收银台仅支持国际卡支付，请配置渠道后扩展");
    }
    if (!stripeConfigured()) {
      throw new UnauthorizedException("国际卡支付尚未配置 Stripe 密钥");
    }

    String sessionUrl = createCheckoutSession(order);
    return new CreatePaymentResponse(false, "stripe", sessionUrl);
  }

  public String handleStripeWebhook(String payload, String signatureHeader) {
    if (!stripeConfigured()) {
      throw new UnauthorizedException("Stripe webhook 未配置");
    }
    verifySignature(payload, signatureHeader);
    try {
      JsonNode root = MAPPER.readTree(payload);
      String type = root.path("type").asText();
      if (!"checkout.session.completed".equals(type)) {
        return "ignored";
      }
      JsonNode session = root.path("data").path("object");
      String orderNo = session.path("client_reference_id").asText(null);
      String paymentIntent = session.path("payment_intent").asText(null);
      String currency = session.path("currency").asText(null);
      long amountMinor = session.path("amount_total").asLong(0);
      if (!hasText(orderNo) || !hasText(paymentIntent) || !hasText(currency)) {
        log.warn("Stripe webhook 缺少必要字段 orderNo={} paymentIntent={}", orderNo, paymentIntent);
        return "ignored";
      }
      BigDecimal amount = fromMinorUnit(amountMinor, currency);
      orderService.markPaidByGateway(orderNo, "stripe", paymentIntent, amount, currency);
      return "ok";
    } catch (Exception ex) {
      log.warn("处理 Stripe webhook 失败", ex);
      throw ex instanceof RuntimeException runtimeEx
          ? runtimeEx
          : new IllegalStateException("处理 Stripe webhook 失败: " + ex.getMessage(), ex);
    }
  }

  private Order requirePendingOrder(String orderNo) {
    Order order = orderMapper.selectOne(
        Wrappers.lambdaQuery(Order.class).eq(Order::getOrderNo, orderNo));
    if (order == null) {
      throw new ResourceNotFoundException("Order not found: " + orderNo);
    }
    if (order.getStatus() == null || order.getStatus() != OrderStatus.PENDING_PAYMENT.code()) {
      throw new IllegalArgumentException("当前订单状态不允许支付");
    }
    return order;
  }

  private String createCheckoutSession(Order order) {
    Map<String, String> params = new HashMap<>();
    params.put("mode", "payment");
    params.put("client_reference_id", order.getOrderNo());
    params.put(
        "success_url",
        returnUrlBase + successPath + "&orderNo=" + encode(order.getOrderNo()));
    params.put(
        "cancel_url",
        returnUrlBase + cancelPath + "&orderNo=" + encode(order.getOrderNo()));
    params.put("payment_method_types[0]", "card");
    params.put("line_items[0][quantity]", "1");
    params.put(
        "line_items[0][price_data][currency]",
        order.getCurrency() == null ? "sgd" : order.getCurrency().toLowerCase());
    params.put(
        "line_items[0][price_data][unit_amount]",
        String.valueOf(toMinorUnit(order.getTotalAmount(), order.getCurrency())));
    params.put("line_items[0][price_data][product_data][name]", "BUZUD Order " + order.getOrderNo());

    JsonNode body = post("/v1/checkout/sessions", params);
    String url = body.path("url").asText(null);
    if (!hasText(url)) {
      throw new IllegalStateException("Stripe 未返回结算页地址");
    }
    return url;
  }

  private boolean stripeConfigured() {
    return hasText(stripeSecretKey) && hasText(stripeWebhookSecret);
  }

  private JsonNode post(String path, Map<String, String> params) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(stripeApiBaseUrl + path))
          .header("Authorization", "Bearer " + stripeSecretKey)
          .header("Content-Type", "application/x-www-form-urlencoded")
          .timeout(Duration.ofSeconds(20))
          .POST(HttpRequest.BodyPublishers.ofString(encodeForm(params), StandardCharsets.UTF_8))
          .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new IllegalStateException(
            "Stripe 请求失败 status=" + response.statusCode() + " body=" + truncate(response.body()));
      }
      return MAPPER.readTree(response.body());
    } catch (IllegalStateException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalStateException("调用 Stripe 失败: " + ex.getMessage(), ex);
    }
  }

  private void verifySignature(String payload, String signatureHeader) {
    if (!hasText(signatureHeader)) {
      throw new IllegalArgumentException("缺少 Stripe-Signature 请求头");
    }
    String[] parts = signatureHeader.split(",");
    if (parts.length < 2 || !parts[0].startsWith("t=")) {
      throw new IllegalArgumentException("Stripe-Signature 格式非法");
    }
    long timestamp;
    try {
      timestamp = Long.parseLong(parts[0].substring(2));
    } catch (NumberFormatException ex) {
      throw new IllegalArgumentException("Stripe-Signature 时间戳非法");
    }
    if (Math.abs(Instant.now().getEpochSecond() - timestamp) > WEBHOOK_REPLAY_WINDOW_SECONDS) {
      throw new IllegalArgumentException("webhook 时间戳过期");
    }

    List<String> signatures = new ArrayList<>();
    for (int i = 1; i < parts.length; i++) {
      if (parts[i].startsWith("v1=")) {
        signatures.add(parts[i].substring(3));
      }
    }
    if (signatures.isEmpty()) {
      throw new IllegalArgumentException("Stripe-Signature 缺少 v1 签名");
    }
    String signedPayload = timestamp + "." + payload;
    byte[] expected = hmacSha256(stripeWebhookSecret, signedPayload);
    for (String signature : signatures) {
      try {
        if (MessageDigest.isEqual(expected, hexDecode(signature))) {
          return;
        }
      } catch (IllegalArgumentException ignored) {
        // 继续尝试下一个签名
      }
    }
    throw new IllegalArgumentException("webhook 签名校验失败");
  }

  private String encodeForm(Map<String, String> params) {
    StringBuilder sb = new StringBuilder();
    for (Map.Entry<String, String> entry : params.entrySet()) {
      if (sb.length() > 0) {
        sb.append('&');
      }
      sb.append(entry.getKey()).append('=').append(encode(entry.getValue()));
    }
    return sb.toString();
  }

  private String encode(String value) {
    return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
  }

  private static BigDecimal fromMinorUnit(long amountMinor, String currency) {
    return BigDecimal.valueOf(amountMinor).movePointLeft(minorUnitScale(currency));
  }

  private static long toMinorUnit(BigDecimal amount, String currency) {
    return amount.movePointRight(minorUnitScale(currency))
        .setScale(0, RoundingMode.HALF_UP)
        .longValueExact();
  }

  private static int minorUnitScale(String currency) {
    String normalized = normalizeCurrency(currency);
    if (ZERO_DECIMAL_CURRENCIES.contains(normalized)) {
      return 0;
    }
    if (THREE_DECIMAL_CURRENCIES.contains(normalized)) {
      return 3;
    }
    return 2;
  }

  private static String normalizeCurrency(String currency) {
    return currency == null ? "" : currency.toUpperCase();
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private static byte[] hmacSha256(String secret, String data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    } catch (Exception ex) {
      throw new IllegalStateException("webhook 签名计算失败", ex);
    }
  }

  private static byte[] hexDecode(String hex) {
    if (hex.length() % 2 != 0) {
      throw new IllegalArgumentException("hex 长度非法");
    }
    byte[] data = new byte[hex.length() / 2];
    for (int i = 0; i < data.length; i++) {
      int hi = Character.digit(hex.charAt(i * 2), 16);
      int lo = Character.digit(hex.charAt(i * 2 + 1), 16);
      if (hi < 0 || lo < 0) {
        throw new IllegalArgumentException("非法 hex 字符");
      }
      data[i] = (byte) ((hi << 4) + lo);
    }
    return data;
  }

  private static String truncate(String value) {
    if (value == null) {
      return "";
    }
    return value.length() > 500 ? value.substring(0, 500) : value;
  }
}
