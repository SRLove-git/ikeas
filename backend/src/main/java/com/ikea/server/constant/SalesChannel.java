package com.ikea.server.constant;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/** 销售站点渠道：medical-sg.com 健康商品、home-sg.com 家电商品；life-sg.com 为统一门户。 */
public final class SalesChannel {

  public static final String MEDICAL = "medical";
  public static final String HOME = "home";

  public static final Set<String> SUPPORTED = Set.of(MEDICAL, HOME);

  private static final List<String> HOME_PRODUCT_PREFIXES = List.of("midea-", "toshiba-");

  private SalesChannel() {}

  public static boolean isSupported(String value) {
    return value != null && SUPPORTED.contains(value);
  }

  /**
   * 解析下单渠道：显式且受支持的 siteScope 优先，否则按商品前缀推断。
   *
   * <p>全部商品均为美的/东芝前缀时归入 home，其余（含混合订单与未知前缀）归入 medical。
   */
  public static String resolve(String siteScope, Collection<String> productIds) {
    if (isSupported(siteScope)) {
      return siteScope;
    }
    return deriveFromProductIds(productIds);
  }

  public static String deriveFromProductIds(Collection<String> productIds) {
    if (productIds == null || productIds.isEmpty()) {
      return MEDICAL;
    }
    return productIds.stream().allMatch(SalesChannel::isHomeProductId) ? HOME : MEDICAL;
  }

  public static boolean isHomeProductId(String productId) {
    if (productId == null || productId.isBlank()) {
      return false;
    }
    for (String prefix : HOME_PRODUCT_PREFIXES) {
      if (productId.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }
}
