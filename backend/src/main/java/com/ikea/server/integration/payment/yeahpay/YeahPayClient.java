package com.ikea.server.integration.payment.yeahpay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** YeahPay 托管收银台与电子钱包直连 HTTP 客户端。 */
@Component
public class YeahPayClient {

  static final String HOSTED_CHECKOUT_PATH = "/cardOrder/getRedirectUrl";
  static final String PC_HOSTED_CHECKOUT_PATH = "/cardOrder/getPcRedirectUrl";
  static final String TRADE_TYPE_PATH = "/cardOrder/getTradeType";
  static final String UNIFIED_ORDER_PATH = "/order/unifiedOrder";
  static final String QUERY_ORDER_PATH = "/order/queryOrder";
  private static final Duration ENABLED_METHODS_CACHE_TTL = Duration.ofMinutes(5);

  public record PcCheckoutDetails(
      String consumerId, String customerName, String email, String address, String postalCode) {}

  /** tdCode 是需要由商城本地生成二维码的支付内容。 */
  public record DirectPaymentResult(String tdCode, String transactionNo) {}

  /** 渠道查单结果。found=false 只表示未查到订单，不代表支付失败。 */
  public record QueryOrderResult(
      boolean found,
      Integer status,
      String merchantId,
      String thirdOrderId,
      String transactionNo,
      Long amountMinor,
      String currency,
      String code,
      String traceId) {}

  /** 渠道明确返回业务拒绝；区别于网络故障或无法确认结果的响应。 */
  public static final class RejectedRequestException extends IllegalStateException {
    public RejectedRequestException(String message) {
      super(message);
    }
  }

  private final YeahPayProperties properties;
  private final ObjectMapper mapper;
  private final HttpClient httpClient;
  private final Object enabledMethodsLock = new Object();
  private volatile EnabledMethodsCache enabledMethodsCache;

  private record EnabledMethodsCache(List<String> methods, Instant expiresAt) {}

  @Autowired
  public YeahPayClient(YeahPayProperties properties, ObjectMapper mapper) {
    this(
        properties,
        mapper,
        HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()))
            .build());
  }

  YeahPayClient(YeahPayProperties properties, ObjectMapper mapper, HttpClient httpClient) {
    this.properties = properties;
    this.mapper = mapper;
    this.httpClient = httpClient;
  }

  public boolean isConfigured() {
    return properties.isConfigured();
  }

  /** 查询当前 MID 实际开通的收银台方式；短时缓存并在临时故障时沿用上次成功结果。 */
  public List<String> enabledPaymentMethods() {
    properties.validateForUse();
    Instant now = Instant.now();
    EnabledMethodsCache cached = enabledMethodsCache;
    if (cached != null && now.isBefore(cached.expiresAt())) {
      return cached.methods();
    }
    synchronized (enabledMethodsLock) {
      cached = enabledMethodsCache;
      now = Instant.now();
      if (cached != null && now.isBefore(cached.expiresAt())) {
        return cached.methods();
      }
      try {
        JsonNode response = post(
            TRADE_TYPE_PATH, Map.of("merchantId", properties.getMerchantId()));
        String code = responseCode(response);
        requireSuccessfulCode(response, code);
        JsonNode data = response.path("data");
        if (!data.isArray()) {
          throw responseError("支付方式响应缺少 data 数组", code, traceId(response));
        }
        LinkedHashSet<String> methods = new LinkedHashSet<>();
        for (JsonNode item : data) {
          JsonNode tradeCode = item.get("tradeCode");
          if (tradeCode != null && tradeCode.isTextual()) {
            String method = storefrontMethod(tradeCode.textValue());
            if (method != null) {
              methods.add(method);
            }
          }
        }
        List<String> result = List.copyOf(methods);
        enabledMethodsCache = new EnabledMethodsCache(result, now.plus(ENABLED_METHODS_CACHE_TTL));
        return result;
      } catch (RuntimeException ex) {
        if (cached != null) {
          return cached.methods();
        }
        throw ex;
      }
    }
  }

  private static String storefrontMethod(String tradeCode) {
    if (!hasText(tradeCode)) {
      return null;
    }
    return switch (tradeCode.trim().toUpperCase(Locale.ROOT)) {
      case "PAYNOWPAY" -> "paynow";
      case "WXZF" -> "wechatpay";
      case "ZFBZF" -> "alipay";
      case "VISA" -> "visa";
      case "MASTER" -> "mastercard";
      case "AMEX" -> "amex";
      case "UNIONPAY" -> "unionpay";
      case "APPLEPAY" -> "applepay";
      case "GOOGLEPAY" -> "googlepay";
      default -> null;
    };
  }

  /** 使用商户订单号只读查询渠道状态；接口异常不得降级为支付失败。 */
  public QueryOrderResult queryOrder(String orderNo) {
    properties.validateForUse();
    if (!hasText(orderNo)) {
      throw new IllegalArgumentException("支付查询缺少订单号");
    }
    JsonNode response = post(
        QUERY_ORDER_PATH,
        Map.of("merchantId", properties.getMerchantId(), "thirdOrderId", orderNo));
    String code = responseCode(response);
    String traceId = traceId(response);
    if ("10012".equals(code)) {
      return new QueryOrderResult(false, null, null, null, null, null, null, code, traceId);
    }
    requireSuccessfulCode(response, code);
    JsonNode data = response.path("data");
    if (!data.isObject()) {
      throw responseError("查单响应缺少 data 对象", code, traceId);
    }
    Long statusValue = nonNegativeInteger(data, "status", code, traceId);
    if (statusValue == null || statusValue > Integer.MAX_VALUE) {
      throw responseError("查单响应 status 非法", code, traceId);
    }
    String merchantId = optionalText(data, "merchantId", code, traceId);
    String thirdOrderId = optionalText(data, "thirdOrderId", code, traceId);
    String transactionNo = optionalText(data, "leshuaOrderId", code, traceId);
    if (transactionNo == null) {
      transactionNo = optionalText(data, "channelOrderId", code, traceId);
    }
    Long amountMinor = nonNegativeInteger(data, "amount", code, traceId);
    String currency = optionalText(data, "currency", code, traceId);
    int status = statusValue.intValue();
    if (status == 2
        && (merchantId == null || thirdOrderId == null || transactionNo == null
            || amountMinor == null || currency == null)) {
      throw responseError("查单成功交易缺少必要字段", code, traceId);
    }
    return new QueryOrderResult(
        true, status, merchantId, thirdOrderId, transactionNo, amountMinor, currency, code, traceId);
  }

  public String createHostedCheckout(
      String orderNo, String currency, long amountMinor, String description, String payWay) {
    properties.validateForUse();

    Map<String, Object> body =
        checkoutBody(orderNo, currency, amountMinor, description, payWay, true);
    return checkoutUrl(post(HOSTED_CHECKOUT_PATH, body));
  }

  /** 创建消费者主扫电子钱包订单，不采集或传输银行卡信息。 */
  public DirectPaymentResult createDirectWalletPayment(
      String providerOrderNo,
      String orderNo,
      String currency,
      long amountMinor,
      String description,
      String payWay,
      String jsPayFlag) {
    properties.validateForUse();
    if (!hasText(providerOrderNo) || !hasText(orderNo)
        || !hasText(currency) || !hasText(description)
        || !hasText(payWay) || amountMinor <= 0
        || !("NATIVE".equals(jsPayFlag) || "MWEB".equals(jsPayFlag))) {
      throw new IllegalArgumentException("直连钱包请求参数不完整");
    }

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("payWay", payWay);
    body.put("merchantId", properties.getMerchantId());
    body.put("thirdOrderId", providerOrderNo);
    body.put("amount", String.valueOf(amountMinor));
    body.put("currency", currency);
    body.put("jspayFlag", jsPayFlag);
    // YeahPay's Singapore unified-order sample includes the region even for
    // NATIVE QR payments. Without it, the provider cannot consistently route
    // WeChat Pay and Alipay for a Singapore MID.
    body.put("region", "SG");
    body.put("body", description);
    body.put("notifyUrl", properties.getNotifyUrl());
    if ("MWEB".equals(jsPayFlag)) {
      body.put("jumpUrl", appendOrderNo(properties.getCallbackUrl(), orderNo));
    }

    JsonNode response = post(UNIFIED_ORDER_PATH, body);
    String code = responseCode(response);
    requireSuccessfulCode(response, code);
    String traceId = traceId(response);
    JsonNode data = response.path("data");
    if (!data.isObject()) {
      throw responseError("直连钱包响应缺少 data 对象", code, traceId);
    }
    String tdCode = optionalText(data, "tdCode", code, traceId);
    if (!hasText(tdCode)
        || tdCode.length() > 4096
        || tdCode.chars().anyMatch(Character::isISOControl)) {
      throw responseError("直连钱包未返回有效 tdCode", code, traceId);
    }
    if ("MWEB".equals(jsPayFlag)) {
      validateDirectOnlineUrl(tdCode);
    }
    String transactionNo = optionalText(data, "leshuaOrderId", code, traceId);
    if (transactionNo == null) {
      transactionNo = optionalText(data, "channelOrderId", code, traceId);
    }
    return new DirectPaymentResult(tdCode, transactionNo);
  }

  public String createPcHostedCheckout(
      String orderNo,
      String currency,
      long amountMinor,
      String description,
      String payWay,
      PcCheckoutDetails details) {
    properties.validateForUse();
    validatePcCheckoutDetails(details);

    Map<String, Object> body =
        checkoutBody(orderNo, currency, amountMinor, description, payWay, false);
    String[] names = details.customerName().trim().split("\\s+", 2);
    String firstName = names[0];
    String lastName = names.length > 1 ? names[1] : names[0];

    Map<String, Object> consumerInfo = new LinkedHashMap<>();
    consumerInfo.put("last_name", lastName);
    consumerInfo.put("first_name", firstName);
    consumerInfo.put("email", details.email());
    consumerInfo.put("consumer_id", details.consumerId());

    Map<String, Object> logisticsInfo = new LinkedHashMap<>();
    logisticsInfo.put("country_code", "SG");
    logisticsInfo.put("city", "Singapore");
    logisticsInfo.put("province", "Singapore");
    logisticsInfo.put("street", details.address());
    logisticsInfo.put("postal_code", details.postalCode());

    Map<String, Object> billInfo = new LinkedHashMap<>();
    billInfo.put("last_name", lastName);
    billInfo.put("first_name", firstName);
    billInfo.put("email", details.email());
    billInfo.put("country_code", "SG");
    billInfo.put("city", "Singapore");
    billInfo.put("street", details.address());
    billInfo.put("postal_code", details.postalCode());

    body.put("countdown", 3);
    body.put("target", "other");
    body.put("logisticsInfo", toJson(logisticsInfo));
    body.put("consumerInfo", toJson(consumerInfo));
    body.put("billInfo", toJson(billInfo));
    return checkoutUrl(post(PC_HOSTED_CHECKOUT_PATH, body));
  }

  private Map<String, Object> checkoutBody(
      String orderNo,
      String currency,
      long amountMinor,
      String description,
      String payWay,
      boolean includeMerchantReferenceNumber) {

    Map<String, Object> goods = new LinkedHashMap<>();
    goods.put("name", description);
    goods.put("number", 1);
    goods.put("currency", currency);
    goods.put("amount", amountMinor);

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("merchantId", properties.getMerchantId());
    body.put("orderId", orderNo);
    if (includeMerchantReferenceNumber) {
      body.put("merchantReferenceNumber", orderNo);
    }
    body.put("busiType", "PHYSICAL");
    body.put("currency", currency);
    body.put("amount", String.valueOf(amountMinor));
    body.put("goodsList", toJson(List.of(goods)));
    body.put("timestamp", YeahPaySigner.timestamp());
    body.put("callback", appendOrderNo(properties.getCallbackUrl(), orderNo));
    body.put("notifyUrl", properties.getNotifyUrl());
    body.put("lang", properties.getLang());
    if (hasText(payWay)) {
      body.put("payWay", payWay);
    }
    return body;
  }

  private String checkoutUrl(JsonNode response) {
    String code = responseCode(response);
    requireSuccessfulCode(response, code);
    String traceId = traceId(response);
    String checkoutUrl = optionalText(response.path("data"), "url", code, traceId);
    if (!hasText(checkoutUrl)) {
      checkoutUrl = optionalText(response, "url", code, traceId);
    }
    if (!hasText(checkoutUrl)) {
      throw responseError("未返回收银台地址", code, traceId);
    }
    validateCheckoutUrl(checkoutUrl);
    return checkoutUrl;
  }

  private static String responseCode(JsonNode response) {
    JsonNode code = response == null ? null : response.get("code");
    if (code == null || !(code.isTextual() || code.isIntegralNumber())
        || !code.asText().matches("-?(0|[1-9][0-9]{0,9})")) {
      throw responseError("响应业务码缺失或非法", "invalid", traceId(response));
    }
    return code.asText();
  }

  private static void requireSuccessfulCode(JsonNode response, String code) {
    // 公共响应规范使用 0，收银台接口表使用 200；线上均需兼容。
    if ("0".equals(code) || "200".equals(code)) {
      return;
    }
    String message = response.path("message").asText("");
    String reason = "Merchant payment unavailable".equalsIgnoreCase(message.trim())
        ? "当前商户尚未开通该支付方式，请选择其他支付方式"
        : "接口返回失败";
    throw new RejectedRequestException(responseErrorMessage(reason, code, traceId(response)));
  }

  private static String optionalText(JsonNode data, String field, String code, String traceId) {
    JsonNode value = data.get(field);
    if (value == null || value.isNull()) {
      return null;
    }
    if (!value.isTextual() || !hasText(value.textValue())) {
      throw responseError("响应字段 " + field + " 非法", code, traceId);
    }
    return value.textValue();
  }

  private static Long nonNegativeInteger(
      JsonNode data, String field, String code, String traceId) {
    JsonNode value = data.get(field);
    if (value == null || value.isNull()) {
      return null;
    }
    if (!(value.isIntegralNumber() || value.isTextual())
        || !value.asText().matches("0|[1-9][0-9]*")) {
      throw responseError("响应字段 " + field + " 必须为非负整数", code, traceId);
    }
    try {
      return Long.parseLong(value.asText());
    } catch (NumberFormatException ex) {
      throw responseError("响应字段 " + field + " 超出整数范围", code, traceId);
    }
  }

  private static String traceId(JsonNode response) {
    JsonNode trace = response == null ? null : response.get("traceId");
    return trace != null && trace.isTextual()
        && trace.textValue().matches("[A-Za-z0-9._:-]{1,128}") ? trace.textValue() : null;
  }

  private static IllegalStateException responseError(String reason, String code, String traceId) {
    return new IllegalStateException(responseErrorMessage(reason, code, traceId));
  }

  private static String responseErrorMessage(String reason, String code, String traceId) {
    return "YeahPay " + reason + " code=" + code
        + (traceId == null ? "" : " traceId=" + traceId);
  }

  private static void validatePcCheckoutDetails(PcCheckoutDetails details) {
    if (details == null
        || !hasText(details.consumerId())
        || !hasText(details.customerName())
        || !hasText(details.email())
        || !hasText(details.address())
        || details.postalCode() == null) {
      throw new IllegalArgumentException("PC 收银台缺少消费者或配送信息");
    }
  }

  JsonNode post(String path, Object requestBody) {
    String rawBody = toJson(requestBody);
    String fullUrl = joinUrl(properties.getApiBaseUrl(), path);
    String signatureUrl = signatureUrl(fullUrl, properties.getSignatureDomain());
    String timestamp = YeahPaySigner.timestamp();
    String nonce = YeahPaySigner.nonce();
    String signature =
        YeahPaySigner.sign(
            signatureUrl,
            properties.getAppId(),
            timestamp,
            YeahPaySigner.VERSION,
            nonce,
            rawBody,
            properties.getApiKey());

    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(URI.create(fullUrl))
            .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
            .header("Content-Type", "application/json")
            .header("Accept", "application/json")
            .header("version", YeahPaySigner.VERSION)
            .header("timestamp", timestamp)
            .header("algorithm", YeahPaySigner.ALGORITHM)
            .header("signature", signature)
            .header("appId", properties.getAppId())
            .header("nonce", nonce)
            .POST(HttpRequest.BodyPublishers.ofString(rawBody))
            .build();

    try {
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        // 错误响应也可能包含收银台令牌，不将原始内容放入异常或日志。
        throw new IllegalStateException("YeahPay 请求失败 status=" + response.statusCode());
      }
      return mapper.readTree(response.body());
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("调用 YeahPay 被中断", ex);
    } catch (IOException ex) {
      throw new IllegalStateException("调用 YeahPay 失败: " + ex.getMessage(), ex);
    }
  }

  private String toJson(Object value) {
    try {
      return mapper.writeValueAsString(value);
    } catch (IOException ex) {
      throw new IllegalStateException("YeahPay 请求序列化失败", ex);
    }
  }

  static String signatureUrl(String fullUrl, String signatureDomain) {
    if (!hasText(signatureDomain) || !fullUrl.startsWith(signatureDomain)) {
      throw new IllegalStateException("YeahPay signature-domain 与 api-base-url 不匹配");
    }
    String result = fullUrl.substring(signatureDomain.length());
    return result.startsWith("/") ? result : "/" + result;
  }

  private static String joinUrl(String baseUrl, String path) {
    return baseUrl.replaceAll("/+$", "") + "/" + path.replaceAll("^/+", "");
  }

  private static String appendOrderNo(String url, String orderNo) {
    String separator = url.contains("?") ? "&" : "?";
    return url + separator + "orderNo=" + java.net.URLEncoder.encode(
        orderNo, java.nio.charset.StandardCharsets.UTF_8);
  }

  static void validateCheckoutUrl(String checkoutUrl) {
    URI uri;
    try {
      uri = URI.create(checkoutUrl);
    } catch (IllegalArgumentException ex) {
      throw new IllegalStateException("YeahPay 返回了非法收银台地址", ex);
    }
    String host = uri.getHost();
    if (!"https".equalsIgnoreCase(uri.getScheme())
        || host == null
        || !(isDomain(host, "yeahpay.sg") || isDomain(host, "yeahpay.net"))) {
      throw new IllegalStateException("YeahPay 收银台地址不属于允许的 HTTPS YeahPay 域名");
    }
  }

  static void validateDirectOnlineUrl(String paymentUrl) {
    URI uri;
    try {
      uri = URI.create(paymentUrl);
    } catch (IllegalArgumentException ex) {
      throw new IllegalStateException("YeahPay 返回了非法的在线支付地址", ex);
    }
    if (!"https".equalsIgnoreCase(uri.getScheme())
        || !hasText(uri.getHost())
        || uri.getUserInfo() != null) {
      throw new IllegalStateException("YeahPay 在线支付地址必须是不含凭据的 HTTPS 地址");
    }
  }

  private static boolean isDomain(String host, String domain) {
    return host.equalsIgnoreCase(domain)
        || host.toLowerCase(java.util.Locale.ROOT).endsWith("." + domain);
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

}
