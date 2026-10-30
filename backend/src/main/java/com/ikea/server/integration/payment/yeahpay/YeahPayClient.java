package com.ikea.server.integration.payment.yeahpay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/** YeahPay 托管收银台 HTTP 客户端。 */
@Component
public class YeahPayClient {

  static final String HOSTED_CHECKOUT_PATH = "/cardOrder/getRedirectUrl";
  static final String PC_HOSTED_CHECKOUT_PATH = "/cardOrder/getPcRedirectUrl";

  public record PcCheckoutDetails(
      String consumerId, String customerName, String email, String address, String postalCode) {}

  private final YeahPayProperties properties;
  private final ObjectMapper mapper;
  private final HttpClient httpClient;

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

  public String createHostedCheckout(
      String orderNo, String currency, long amountMinor, String description, String payWay) {
    properties.validateForUse();

    Map<String, Object> body =
        checkoutBody(orderNo, currency, amountMinor, description, payWay, true);
    return checkoutUrl(post(HOSTED_CHECKOUT_PATH, body));
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
    String checkoutUrl = response.path("data").path("url").asText(null);
    if (!hasText(checkoutUrl)) {
      checkoutUrl = response.path("url").asText(null);
    }
    if (!hasText(checkoutUrl)) {
      String code = response.path("code").asText("");
      String message = response.path("message").asText("");
      if ("Merchant payment unavailable".equalsIgnoreCase(message.trim())) {
        throw new IllegalStateException("当前商户尚未开通该支付方式，请选择其他支付方式");
      }
      throw new IllegalStateException(
          "YeahPay 未返回收银台地址 code=" + code + " message=" + truncate(message));
    }
    validateCheckoutUrl(checkoutUrl);
    return checkoutUrl;
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
        throw new IllegalStateException(
            "YeahPay 请求失败 status="
                + response.statusCode()
                + " body="
                + truncate(response.body()));
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

  private static boolean isDomain(String host, String domain) {
    return host.equalsIgnoreCase(domain)
        || host.toLowerCase(java.util.Locale.ROOT).endsWith("." + domain);
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }

  private static String truncate(String value) {
    if (value == null) {
      return "";
    }
    return value.length() > 500 ? value.substring(0, 500) : value;
  }
}
