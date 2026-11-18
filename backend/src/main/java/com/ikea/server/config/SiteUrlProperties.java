package com.ikea.server.config;

import com.ikea.server.constant.SalesChannel;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/** 拆分后的站点前台域名，用于按订单渠道生成支付回跳地址。 */
@Component
@ConfigurationProperties(prefix = "ikea.sites")
public class SiteUrlProperties {

  private String medicalUrl = "https://medical-sg.com";
  private String homeUrl = "https://home-sg.com";
  private String portalUrl = "https://life-sg.com";

  /** 返回渠道对应的站点根地址；未设置或非 medical/home 时返回 null。 */
  public String baseUrlFor(String salesChannel) {
    if (SalesChannel.MEDICAL.equals(salesChannel)) {
      return trimToNull(medicalUrl);
    }
    if (SalesChannel.HOME.equals(salesChannel)) {
      return trimToNull(homeUrl);
    }
    return null;
  }

  public String getMedicalUrl() {
    return medicalUrl;
  }

  public void setMedicalUrl(String medicalUrl) {
    this.medicalUrl = medicalUrl;
  }

  public String getHomeUrl() {
    return homeUrl;
  }

  public void setHomeUrl(String homeUrl) {
    this.homeUrl = homeUrl;
  }

  public String getPortalUrl() {
    return portalUrl;
  }

  public void setPortalUrl(String portalUrl) {
    this.portalUrl = portalUrl;
  }

  private static String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
