package com.ikea.server.dto.referral;

import java.math.BigDecimal;
import java.util.List;

public final class ReferralDtos {

  private ReferralDtos() {}

  public record ReferralSummary(
      String code,
      int referralCount,
      int issuedCouponCount,
      int nextMilestone,
      int progress,
      List<ReferralRewardView> rewards) {}

  public record ReferralRewardView(
      Long id,
      String couponName,
      BigDecimal value,
      BigDecimal minAmount,
      String earnedAt,
      String inviteeName) {}
}
