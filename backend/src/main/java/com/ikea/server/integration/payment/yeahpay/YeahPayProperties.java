package com.ikea.server.integration.payment.yeahpay;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** YeahPay Singapore 托管收银台配置。凭据只能由服务器环境变量注入。 */
@Component
@ConfigurationProperties(prefix = "ikea.payment.yeahpay")
public class YeahPayProperties {

  private static final Set<String> SUPPORTED_METHODS =
      Set.of(
          "paynow", "wechatpay", "alipay",
          "visa", "mastercard", "amex", "unionpay", "applepay", "googlepay");

  private boolean enabled;
  private boolean pcCheckoutEnabled = false;
  private String appId = "";
  private String apiKey = "";
  private String merchantId = "";
  private String apiBaseUrl =
      "https://open-api.yeahpay.sg/acceptance/acceptance-open-api";
  private String signatureDomain = "https://open-api.yeahpay.sg/acceptance";
  private String callbackUrl =
      "https://medical-sg.com/zh/profile/my-orders?payment=success";
  private String notifyUrl = "https://medical-sg.com/api/v1/payment/yeahpay/webhook";
  private String lang = "en";
  private String enabledMethods = "paynow,wechatpay,alipay,visa,mastercard,amex";
  private int connectTimeoutMs = 10000;
  private int readTimeoutMs = 20000;
  private int callbackReplayWindowSeconds = 300;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public boolean isPcCheckoutEnabled() {
    return pcCheckoutEnabled;
  }

  public void setPcCheckoutEnabled(boolean pcCheckoutEnabled) {
    this.pcCheckoutEnabled = pcCheckoutEnabled;
  }

  public String getAppId() {
    return appId;
  }

  public void setAppId(String appId) {
    this.appId = appId;
  }

  public String getApiKey() {
    return apiKey;
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey;
  }

  public String getMerchantId() {
    return merchantId;
  }

  public void setMerchantId(String merchantId) {
    this.merchantId = merchantId;
  }

  public String getApiBaseUrl() {
    return apiBaseUrl;
  }

  public void setApiBaseUrl(String apiBaseUrl) {
    this.apiBaseUrl = apiBaseUrl;
  }

  public String getSignatureDomain() {
    return signatureDomain;
  }

  public void setSignatureDomain(String signatureDomain) {
    this.signatureDomain = signatureDomain;
  }

  public String getCallbackUrl() {
    return callbackUrl;
  }

  public void setCallbackUrl(String callbackUrl) {
    this.callbackUrl = callbackUrl;
  }

  public String getNotifyUrl() {
    return notifyUrl;
  }

  public void setNotifyUrl(String notifyUrl) {
    this.notifyUrl = notifyUrl;
  }

  public String getLang() {
    return lang;
  }

  public void setLang(String lang) {
    this.lang = lang;
  }

  public String getEnabledMethods() {
    return enabledMethods;
  }

  public void setEnabledMethods(String enabledMethods) {
    this.enabledMethods = enabledMethods;
  }

  public List<String> enabledPaymentMethods() {
    if (enabledMethods == null || enabledMethods.isBlank()) {
      return List.of();
    }
    return Arrays.stream(enabledMethods.split(","))
        .map(String::trim)
        .filter(value -> !value.isEmpty())
        .map(value -> value.toLowerCase(Locale.ROOT))
        .distinct()
        .toList();
  }

  public int getConnectTimeoutMs() {
    return connectTimeoutMs;
  }

  public void setConnectTimeoutMs(int connectTimeoutMs) {
    this.connectTimeoutMs = connectTimeoutMs;
  }

  public int getReadTimeoutMs() {
    return readTimeoutMs;
  }

  public void setReadTimeoutMs(int readTimeoutMs) {
    this.readTimeoutMs = readTimeoutMs;
  }

  public int getCallbackReplayWindowSeconds() {
    return callbackReplayWindowSeconds;
  }

  public void setCallbackReplayWindowSeconds(int callbackReplayWindowSeconds) {
    this.callbackReplayWindowSeconds = callbackReplayWindowSeconds;
  }

  public boolean isConfigured() {
    List<String> methods = enabledPaymentMethods();
    return enabled
        && hasText(appId)
        && hasText(apiKey)
        && hasText(merchantId)
        && hasText(apiBaseUrl)
        && hasText(signatureDomain)
        && hasText(callbackUrl)
        && hasText(notifyUrl)
        && !methods.isEmpty()
        && SUPPORTED_METHODS.containsAll(methods);
  }

  public void validateForUse() {
    if (!isConfigured()) {
      throw new IllegalStateException(
          "YeahPay 未启用或配置不完整，请检查 enabled/app-id/api-key/merchant-id/URL 配置");
    }
    if (connectTimeoutMs <= 0 || readTimeoutMs <= 0 || callbackReplayWindowSeconds <= 0) {
      throw new IllegalStateException("YeahPay 超时与回调时间窗必须大于 0");
    }
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
