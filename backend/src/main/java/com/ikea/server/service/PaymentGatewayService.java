package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.payment.PaymentDtos.CreatePaymentResponse;
import com.ikea.server.dto.payment.PaymentDtos.PaymentOptions;
import com.ikea.server.dto.payment.PaymentDtos.PaymentStatusResponse;
import com.ikea.server.service.PaymentPersistenceService.PaymentAttempt;
import com.ikea.server.service.PaymentPersistenceService.ProviderOrder;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.Order;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient.DirectPaymentResult;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient.PcCheckoutDetails;
import com.ikea.server.integration.payment.yeahpay.YeahPayProperties;
import com.ikea.server.integration.payment.yeahpay.YeahPaySigner;
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
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 商城收银台：真实模式下优先使用 YeahPay 托管收银台，并保留 Stripe 兼容，
 * 未配置密钥或 mock-only=true 时保留本地模拟支付，保证演示链路可跑。
 */
@Service
public class PaymentGatewayService {

  private static final Logger log = LoggerFactory.getLogger(PaymentGatewayService.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final int WEBHOOK_REPLAY_WINDOW_SECONDS = 300;
  private static final List<String> STRIPE_CARD_METHODS = List.of("visa", "mastercard", "amex");
  private static final Pattern EMAIL_PATTERN =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
  private static final Pattern SINGAPORE_POSTAL_CODE = Pattern.compile("(?<!\\d)(\\d{6})(?!\\d)");
  private static final Set<String> ZERO_DECIMAL_CURRENCIES = Set.of(
      "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG",
      "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF");
  private static final Set<String> THREE_DECIMAL_CURRENCIES = Set.of("BHD", "JOD", "KWD", "OMR", "TND");
  private static final Map<String, String> YEAHPAY_PAYMENT_METHODS = Map.of(
      "visa", "VISA",
      "mastercard", "MASTER",
      "amex", "AMEX",
      "unionpay", "UnionPay",
      "applepay", "ApplePay",
      "googlepay", "GooglePay");
  private static final Map<String, String> YEAHPAY_DIRECT_WALLETS = Map.of(
      "paynow", "PayNowPay",
      "wechatpay", "WXZF",
      "alipay", "ZFBZF");

  private final OrderMapper orderMapper;
  private final OrderService orderService;
  private final YeahPayClient yeahPayClient;
  private final YeahPayProperties yeahPayProperties;
  private final PaymentPersistenceService paymentPersistenceService;
  private final UserService userService;
  private final PaymentReconciliationService paymentReconciliationService;
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

  public PaymentGatewayService(
      OrderMapper orderMapper,
      OrderService orderService,
      YeahPayClient yeahPayClient,
      YeahPayProperties yeahPayProperties,
      PaymentPersistenceService paymentPersistenceService,
      UserService userService,
      PaymentReconciliationService paymentReconciliationService) {
    this.orderMapper = orderMapper;
    this.orderService = orderService;
    this.yeahPayClient = yeahPayClient;
    this.yeahPayProperties = yeahPayProperties;
    this.paymentPersistenceService = paymentPersistenceService;
    this.userService = userService;
    this.paymentReconciliationService = paymentReconciliationService;
  }

  public PaymentStatusResponse refreshPayment(Long userId, String orderNo) {
    return paymentReconciliationService.refresh(userId, orderNo);
  }

  public PaymentOptions options() {
    if (mockOnly) {
      return new PaymentOptions(true, stripePublicKey, "mock", List.of());
    }
    if (yeahPayClient.isConfigured()) {
      return new PaymentOptions(
          false, stripePublicKey, "yeahpay", yeahPayProperties.enabledPaymentMethods());
    }
    if (stripeConfigured()) {
      return new PaymentOptions(
          false, stripePublicKey, "stripe", STRIPE_CARD_METHODS);
    }
    return new PaymentOptions(false, stripePublicKey, "unavailable", List.of());
  }

  public CreatePaymentResponse createPayment(Long userId, String orderNo, String channel) {
    return createPayment(userId, orderNo, channel, "h5");
  }

  public CreatePaymentResponse createPayment(
      Long userId, String orderNo, String channel, String checkoutMode) {
    Order order = requirePendingOrder(userId, orderNo);
    String currency = hasText(order.getCurrency()) ? normalizeCurrency(order.getCurrency()) : "SGD";
    if (order.getTotalAmount() == null || order.getTotalAmount().signum() < 0) {
      throw new IllegalArgumentException("订单应付金额无效");
    }
    if (order.getTotalAmount().signum() == 0) {
      orderService.markPaidByGateway(
          order.getOrderNo(), "internal", "ZERO-" + order.getOrderNo(), BigDecimal.ZERO, currency);
      return new CreatePaymentResponse(false, "internal", null, null, true);
    }
    if (mockOnly) {
      return new CreatePaymentResponse(true, "mock", null, null, false);
    }

    String normalized =
        channel == null || channel.isBlank()
            ? "card"
            : channel.toLowerCase(java.util.Locale.ROOT);
    if (!Set.of(
            "card", "paynow", "wechatpay", "alipay",
            "visa", "mastercard", "amex", "unionpay", "applepay", "googlepay",
            "yeahpay", "stripe")
        .contains(normalized)) {
      throw new IllegalArgumentException("不支持的支付方式");
    }
    boolean explicitlyStripe = "stripe".equals(normalized);
    boolean explicitlyYeahPay = "yeahpay".equals(normalized);
    String yeahPayMethod = firstNonBlank(
        YEAHPAY_DIRECT_WALLETS.get(normalized), YEAHPAY_PAYMENT_METHODS.get(normalized));
    if (!explicitlyStripe && yeahPayClient.isConfigured()) {
      List<String> enabledMethods = yeahPayProperties.enabledPaymentMethods();
      String yeahPayChannel = normalized;
      if (yeahPayMethod == null) {
        yeahPayChannel = enabledMethods.stream()
            .filter(method -> !"card".equals(normalized)
                || YEAHPAY_PAYMENT_METHODS.containsKey(method))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("商户暂未开通可用的卡支付方式"));
        yeahPayMethod = firstNonBlank(
            YEAHPAY_DIRECT_WALLETS.get(yeahPayChannel),
            YEAHPAY_PAYMENT_METHODS.get(yeahPayChannel));
      }
      if (!enabledMethods.contains(yeahPayChannel)) {
        throw new IllegalArgumentException("该支付方式尚未为当前商户启用");
      }
      if (hasText(checkoutMode)
          && !"h5".equalsIgnoreCase(checkoutMode)
          && !"pc".equalsIgnoreCase(checkoutMode)
          && !"qr".equalsIgnoreCase(checkoutMode)
          && !"online".equalsIgnoreCase(checkoutMode)) {
        throw new IllegalArgumentException("不支持的收银台类型");
      }
      boolean directWallet = YEAHPAY_DIRECT_WALLETS.containsKey(yeahPayChannel);
      boolean directOnline = directWallet && "online".equalsIgnoreCase(checkoutMode);
      String directPresentation = directOnline ? "redirect" : "qr";
      boolean usePcCheckout = !directWallet && "pc".equalsIgnoreCase(checkoutMode)
          && yeahPayProperties.isPcCheckoutEnabled();
      // 本地校验失败未发出渠道请求，不应留下无法确认的支付会话。
      PcCheckoutDetails pcDetails = usePcCheckout ? pcCheckoutDetails(userId, order) : null;
      PaymentAttempt previous = paymentPersistenceService.findAttempt(orderNo).orElse(null);
      if (previous != null && "yeahpay".equals(previous.provider())) {
        PaymentStatusResponse refreshed = paymentReconciliationService.refresh(userId, orderNo);
        if ("paid".equals(refreshed.status())) {
          return new CreatePaymentResponse(false, "yeahpay", null, null, true);
        }
        if (!refreshed.retryAllowed()) {
          PaymentAttempt current = paymentPersistenceService.findAttempt(orderNo).orElse(null);
          if (current != null && current.status() == 0 && "yeahpay".equals(current.provider())
              && hasText(current.checkoutUrl()) && yeahPayChannel.equals(current.channel())) {
            boolean qr = "qr".equals(current.presentation());
            return new CreatePaymentResponse(
                false,
                qr ? yeahPayChannel : "yeahpay",
                qr ? null : current.checkoutUrl(),
                qr ? current.checkoutUrl() : null,
                false);
          }
          throw new IllegalArgumentException("支付状态尚未确认，请先更新支付状态或联系客服");
        }
      }
      long amountMinor = toMinorUnit(order.getTotalAmount(), currency);
      String description = "BUZUD Order " + order.getOrderNo();
      reservePaymentAttempt(order.getOrderNo(), "yeahpay", yeahPayChannel);
      PaymentAttempt reserved = paymentPersistenceService.findAttempt(orderNo)
          .orElseThrow(() -> new IllegalStateException("支付会话未保存，请稍后查询订单状态"));
      try {
        if (directWallet) {
          String providerOrderNo = directProviderOrderNo();
          paymentPersistenceService.saveProviderOrder(
              orderNo,
              "yeahpay",
              providerOrderNo,
              yeahPayChannel,
              directPresentation,
              reserved.createdAt());
          DirectPaymentResult direct = yeahPayClient.createDirectWalletPayment(
              providerOrderNo,
              orderNo,
              currency,
              amountMinor,
              description,
              yeahPayMethod,
              directOnline ? "MWEB" : "NATIVE");
          paymentPersistenceService.savePaymentPresentation(
              orderNo, "yeahpay", direct.tdCode(), directPresentation, reserved.createdAt());
          return new CreatePaymentResponse(
              false,
              yeahPayChannel,
              directOnline ? direct.tdCode() : null,
              directOnline ? null : direct.tdCode(),
              false);
        }
        String checkoutUrl;
        if (usePcCheckout) {
          checkoutUrl =
              yeahPayClient.createPcHostedCheckout(
                  order.getOrderNo(),
                  currency,
                  amountMinor,
                  description,
                  yeahPayMethod,
                  pcDetails);
        } else {
          checkoutUrl =
              yeahPayClient.createHostedCheckout(
                  order.getOrderNo(), currency, amountMinor, description, yeahPayMethod);
        }
        paymentPersistenceService.saveCheckoutUrl(
            orderNo, "yeahpay", checkoutUrl, reserved.createdAt());
        return new CreatePaymentResponse(false, "yeahpay", checkoutUrl, null, false);
      } catch (YeahPayClient.RejectedRequestException ex) {
        paymentPersistenceService.markPaymentAttemptFailed(order.getOrderNo(), "yeahpay");
        throw ex;
      }
    }
    if (explicitlyYeahPay
        || (yeahPayMethod != null && !STRIPE_CARD_METHODS.contains(normalized))) {
      throw new UnauthorizedException("YeahPay 尚未启用或凭据配置不完整");
    }
    if (!stripeConfigured()) {
      throw new UnauthorizedException("YeahPay 与 Stripe 均未完成服务器凭据配置");
    }

    reservePaymentAttempt(order.getOrderNo(), "stripe", normalized);
    try {
      String sessionUrl = createCheckoutSession(order);
      return new CreatePaymentResponse(false, "stripe", sessionUrl, null, false);
    } catch (RuntimeException ex) {
      paymentPersistenceService.markPaymentAttemptFailed(order.getOrderNo(), "stripe");
      throw ex;
    }
  }

  private void reservePaymentAttempt(String orderNo, String provider, String channel) {
    if (!paymentPersistenceService.reservePaymentAttempt(orderNo, provider, channel)) {
      throw new IllegalArgumentException("该订单已有支付会话，请先更新支付状态后继续支付");
    }
  }

  private PcCheckoutDetails pcCheckoutDetails(Long userId, Order order) {
    AppUser user =
        userService.findById(userId).orElseThrow(() -> new UnauthorizedException("用户信息不存在"));
    String customerName = firstNonBlank(order.getCustomer(), user.getName(), user.getUsername());
    if (!hasText(customerName)) {
      throw new IllegalArgumentException("请先补充收货人姓名后再支付");
    }

    String email = firstValidEmail(user.getEmail(), user.getUsername());
    if (!hasText(email)) {
      throw new IllegalArgumentException("请先在账户资料中补充有效邮箱后再支付");
    }

    String address = order.getAddress();
    if (!hasText(address)) {
      throw new IllegalArgumentException("订单缺少收货地址，暂时无法打开收银台");
    }
    Matcher postalCode = SINGAPORE_POSTAL_CODE.matcher(address);
    String postalCodeValue = postalCode.find() ? postalCode.group(1) : "";

    return new PcCheckoutDetails(
        String.valueOf(userId), customerName, email, address, postalCodeValue);
  }

  private static String firstNonBlank(String... values) {
    for (String value : values) {
      if (hasText(value)) {
        return value.trim();
      }
    }
    return null;
  }

  private static String firstValidEmail(String... values) {
    for (String value : values) {
      if (hasText(value) && EMAIL_PATTERN.matcher(value.trim()).matches()) {
        return value.trim();
      }
    }
    return null;
  }

  @Transactional
  public String handleStripeWebhook(String payload, String signatureHeader) {
    if (!stripeConfigured()) {
      throw new UnauthorizedException("Stripe webhook 未配置");
    }
    verifySignature(payload, signatureHeader);
    try {
      JsonNode root = MAPPER.readTree(payload);
      String eventId = root.path("id").asText(null);
      String type = root.path("type").asText();
      if (!"checkout.session.completed".equals(type)) {
        return "ignored";
      }
      JsonNode session = root.path("data").path("object");
      String orderNo = session.path("client_reference_id").asText(null);
      String paymentIntent = session.path("payment_intent").asText(null);
      String currency = session.path("currency").asText(null);
      String paymentStatus = session.path("payment_status").asText(null);
      long amountMinor = session.path("amount_total").asLong(0);
      if (!"paid".equals(paymentStatus)) {
        return "ignored";
      }
      if (!hasText(eventId)
          || !hasText(orderNo)
          || !hasText(paymentIntent)
          || !hasText(currency)) {
        log.warn("Stripe webhook 缺少必要字段 orderNo={} paymentIntent={}", orderNo, paymentIntent);
        return "ignored";
      }
      paymentPersistenceService.findAttemptForUpdate(orderNo);
      if (!paymentPersistenceService.recordCallbackIfAbsent(
          "stripe", eventId, orderNo, paymentIntent)) {
        return "ok";
      }
      paymentPersistenceService.recordSuccessfulTransaction(
          "stripe", orderNo, paymentIntent, amountMinor, currency);
      paymentPersistenceService.markPaymentAttemptSucceeded(orderNo, "stripe");
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

  /** YeahPay 异步通知：先校验头部、时间窗和原始 JSON 签名，再处理成功交易。 */
  @Transactional
  public String handleYeahPayWebhook(
      String payload,
      String version,
      String timestamp,
      String algorithm,
      String signature,
      String appId,
      String nonce) {
    yeahPayProperties.validateForUse();
    validateYeahPayHeaders(version, timestamp, algorithm, signature, appId, nonce);
    if (!YeahPaySigner.verify(
        signature,
        yeahPayProperties.getNotifyUrl(),
        appId,
        timestamp,
        version,
        nonce,
        payload,
        yeahPayProperties.getApiKey())) {
      throw new IllegalArgumentException("YeahPay webhook 签名校验失败");
    }

    try {
      JsonNode root = MAPPER.readTree(payload);
      String merchantId = root.path("merchantId").asText(null);
      if (!yeahPayProperties.getMerchantId().equals(merchantId)) {
        throw new IllegalArgumentException("YeahPay webhook merchantId 不匹配");
      }
      if (root.path("status").asInt(-1) != 2) {
        return "success";
      }

      String providerOrderNo = firstText(root, "thirdOrderId", "merchantReferenceNumber", "orderId");
      String transactionNo = firstText(root, "leshuaOrderId", "channelOrderId");
      String currency = root.path("currency").asText(null);
      JsonNode amountNode = root.path("amount");
      if (!hasText(providerOrderNo)
          || !hasText(transactionNo)
          || !hasText(currency)
          || amountNode.isMissingNode()
          || amountNode.isNull()) {
        throw new IllegalArgumentException("YeahPay webhook 缺少必要交易字段");
      }

      long amountMinor = Long.parseLong(amountNode.asText());
      if (amountMinor < 0) {
        throw new IllegalArgumentException("YeahPay webhook 金额非法");
      }
      ProviderOrder providerOrder = paymentPersistenceService
          .findProviderOrder("yeahpay", providerOrderNo).orElse(null);
      String orderNo = providerOrder == null ? providerOrderNo : providerOrder.orderNo();
      PaymentAttempt attempt = paymentPersistenceService.findAttemptForUpdate(orderNo).orElse(null);
      String settledChannel = providerOrder != null
          ? providerOrder.channel()
          : attempt == null ? "yeahpay" : attempt.channel();
      if (!paymentPersistenceService.recordCallbackIfAbsent(
          "yeahpay", timestamp + "\n" + nonce, orderNo, transactionNo)) {
        return "success";
      }
      paymentPersistenceService.recordSuccessfulTransaction(
          "yeahpay", orderNo, transactionNo, amountMinor, currency);
      paymentPersistenceService.markPaymentAttemptSucceeded(orderNo, "yeahpay");
      orderService.markPaidByGateway(
          orderNo,
          omsPaymentChannel(settledChannel),
          transactionNo,
          fromMinorUnit(amountMinor, currency),
          currency);
      return "success";
    } catch (RuntimeException ex) {
      log.warn("处理 YeahPay webhook 失败", ex);
      throw ex;
    } catch (Exception ex) {
      log.warn("处理 YeahPay webhook 失败", ex);
      throw new IllegalStateException("处理 YeahPay webhook 失败: " + ex.getMessage(), ex);
    }
  }

  private static String directProviderOrderNo() {
    return "D" + UUID.randomUUID().toString().replace("-", "").substring(0, 31);
  }

  static String omsPaymentChannel(String channel) {
    if ("paynow".equalsIgnoreCase(channel)) {
      return "paynow";
    }
    if ("wechatpay".equalsIgnoreCase(channel)) {
      return "wechat";
    }
    if ("alipay".equalsIgnoreCase(channel)) {
      return "alipay";
    }
    return "yeahpay";
  }

  private void validateYeahPayHeaders(
      String version,
      String timestamp,
      String algorithm,
      String signature,
      String appId,
      String nonce) {
    if (!YeahPaySigner.VERSION.equals(version)
        || (algorithm != null && !YeahPaySigner.ALGORITHM.equalsIgnoreCase(algorithm))
        || !hasText(signature)
        || !yeahPayProperties.getAppId().equals(appId)
        || !hasText(nonce)) {
      throw new IllegalArgumentException("YeahPay webhook 请求头缺失或非法");
    }
    long callbackTimestamp;
    try {
      callbackTimestamp = Long.parseLong(timestamp);
    } catch (NumberFormatException ex) {
      throw new IllegalArgumentException("YeahPay webhook 时间戳非法", ex);
    }
    long maxAge = yeahPayProperties.getCallbackReplayWindowSeconds() * 1000L;
    if (Math.abs(System.currentTimeMillis() - callbackTimestamp) > maxAge) {
      throw new IllegalArgumentException("YeahPay webhook 时间戳过期");
    }
  }

  private static String firstText(JsonNode root, String... fields) {
    for (String field : fields) {
      String value = root.path(field).asText(null);
      if (hasText(value)) {
        return value;
      }
    }
    return null;
  }

  private Order requirePendingOrder(Long userId, String orderNo) {
    if (userId == null) {
      throw new UnauthorizedException("请先登录");
    }
    Order order = orderMapper.selectOne(
        Wrappers.lambdaQuery(Order.class)
            .eq(Order::getOrderNo, orderNo)
            .eq(Order::getUserId, userId));
    if (order == null || order.getUserId() == null || !order.getUserId().equals(userId)) {
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

    JsonNode body = post("/v1/checkout/sessions", params, "checkout-" + order.getOrderNo());
    String url = body.path("url").asText(null);
    if (!hasText(url)) {
      throw new IllegalStateException("Stripe 未返回结算页地址");
    }
    return url;
  }

  private boolean stripeConfigured() {
    return hasText(stripeSecretKey) && hasText(stripeWebhookSecret);
  }

  private JsonNode post(String path, Map<String, String> params, String idempotencyKey) {
    try {
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(stripeApiBaseUrl + path))
          .header("Authorization", "Bearer " + stripeSecretKey)
          .header("Idempotency-Key", idempotencyKey)
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
