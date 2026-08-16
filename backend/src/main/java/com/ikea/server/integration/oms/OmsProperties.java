package com.ikea.server.integration.oms;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** OMS 对接配置（对接规范 §4.1 / §8.4）。默认关闭 = 商城独立运行。 */
@ConfigurationProperties(prefix = "ikea.oms")
public class OmsProperties {

  /** 对接开关：false 时不装配任何 OMS 组件，商城独立运行。 */
  private boolean enabled = false;

  private String gatewayUrl = "http://localhost:8080";
  private String appId = "";
  private String appSecret = "";
  private String merchantId = "";
  private int connectTimeoutMs = 2000;
  private int readTimeoutMs = 5000;
  private int maxRetries = 3;
  /** BUZUD 零售订单固定 B2C。 */
  private int orderType = 2;
  private StatusSync statusSync = new StatusSync();
  private ProductSync productSync = new ProductSync();

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getGatewayUrl() {
    return gatewayUrl;
  }

  public void setGatewayUrl(String gatewayUrl) {
    this.gatewayUrl = gatewayUrl;
  }

  public String getAppId() {
    return appId;
  }

  public void setAppId(String appId) {
    this.appId = appId;
  }

  public String getAppSecret() {
    return appSecret;
  }

  public void setAppSecret(String appSecret) {
    this.appSecret = appSecret;
  }

  public String getMerchantId() {
    return merchantId;
  }

  public void setMerchantId(String merchantId) {
    this.merchantId = merchantId;
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

  public int getMaxRetries() {
    return maxRetries;
  }

  public void setMaxRetries(int maxRetries) {
    this.maxRetries = maxRetries;
  }

  public int getOrderType() {
    return orderType;
  }

  public void setOrderType(int orderType) {
    this.orderType = orderType;
  }

  public StatusSync getStatusSync() {
    return statusSync;
  }

  public void setStatusSync(StatusSync statusSync) {
    this.statusSync = statusSync;
  }

  public ProductSync getProductSync() {
    return productSync;
  }

  public void setProductSync(ProductSync productSync) {
    this.productSync = productSync;
  }

  /** 开启对接时强校验必填配置（fail-fast，避免半对接状态）。 */
  public void validate() {
    if (!enabled) {
      return;
    }
    if (isBlank(appId) || isBlank(appSecret) || isBlank(merchantId)) {
      throw new IllegalStateException(
          "ikea.oms.enabled=true 但 app-id/app-secret/merchant-id 未配置，"
              + "请设置 BUZUD_OMS_APP_ID/BUZUD_OMS_APP_SECRET/BUZUD_OMS_MERCHANT_ID，"
              + "或将 ikea.oms.enabled 置为 false 以独立运行");
    }
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  public static class StatusSync {

    private boolean enabled = true;
    /** 轮询间隔，遵循 OMS 约定 ≥ 5s。 */
    private long intervalMs = 5000;
    private int batchSize = 100;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public long getIntervalMs() {
      return intervalMs;
    }

    public void setIntervalMs(long intervalMs) {
      this.intervalMs = intervalMs;
    }

    public int getBatchSize() {
      return batchSize;
    }

    public void setBatchSize(int batchSize) {
      this.batchSize = batchSize;
    }
  }

  public static class ProductSync {

    private boolean enabled = true;
    /** 商品/库存快照刷新间隔（短 TTL 缓存）。 */
    private long intervalMs = 60000;
    private int pageSize = 100;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public long getIntervalMs() {
      return intervalMs;
    }

    public void setIntervalMs(long intervalMs) {
      this.intervalMs = intervalMs;
    }

    public int getPageSize() {
      return pageSize;
    }

    public void setPageSize(int pageSize) {
      this.pageSize = pageSize;
    }
  }
}
