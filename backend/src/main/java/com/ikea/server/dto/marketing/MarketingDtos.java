package com.ikea.server.dto.marketing;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class MarketingDtos {

  private MarketingDtos() {}

  public record AccountResponse(
      int points, BigDecimal balance, List<CouponView> coupons) {}

  public record CouponView(
      Long id,
      String code,
      String name,
      Integer type,
      BigDecimal value,
      BigDecimal minAmount,
      Integer status,
      BigDecimal discountAmount) {}

  public record ClaimRequest(String code) {}

  public record ClaimResponse(String code, String name) {}

  public record RedemptionResponse(
      BigDecimal couponDiscount,
      BigDecimal pointDiscount,
      BigDecimal balanceUsed,
      BigDecimal totalDiscount) {}

  public record AdminCouponRequest(
      String code,
      String name,
      Integer type,
      BigDecimal value,
      BigDecimal minAmount,
      Integer status,
      LocalDateTime validFrom,
      LocalDateTime validTo) {}

  public record AdminAdjustRequest(Integer points, BigDecimal balance) {}
}
