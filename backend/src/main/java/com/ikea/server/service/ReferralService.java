package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.referral.ReferralDtos.ReferralRewardView;
import com.ikea.server.dto.referral.ReferralDtos.ReferralSummary;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.Coupon;
import com.ikea.server.entity.Referral;
import com.ikea.server.entity.ReferralReward;
import com.ikea.server.entity.UserCoupon;
import com.ikea.server.mapper.CouponMapper;
import com.ikea.server.mapper.ReferralMapper;
import com.ikea.server.mapper.ReferralRewardMapper;
import com.ikea.server.mapper.UserCouponMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReferralService {

  private static final String REFER_COUPON = "REFER5";
  private static final String MILESTONE_COUPON = "REFER20";
  private static final int MILESTONE_EVERY = 5;
  private static final int REWARD_LIST_LIMIT = 30;

  private final ReferralMapper referralMapper;
  private final ReferralRewardMapper referralRewardMapper;
  private final CouponMapper couponMapper;
  private final UserCouponMapper userCouponMapper;
  private final UserService userService;
  private final ExperienceVoucherService experienceVoucherService;

  public ReferralService(
      ReferralMapper referralMapper,
      ReferralRewardMapper referralRewardMapper,
      CouponMapper couponMapper,
      UserCouponMapper userCouponMapper,
      UserService userService,
      ExperienceVoucherService experienceVoucherService) {
    this.referralMapper = referralMapper;
    this.referralRewardMapper = referralRewardMapper;
    this.couponMapper = couponMapper;
    this.userCouponMapper = userCouponMapper;
    this.userService = userService;
    this.experienceVoucherService = experienceVoucherService;
  }

  public String referralCode(Long userId) {
    if (userId == null || userId <= 0) {
      throw new IllegalArgumentException("用户不存在");
    }
    return "BUZUD" + userId;
  }

  /**
   * 新用户注册/首次登录成功后调用。无效邀请码、自己邀请自己、重复邀请等情况
   * 只返回 false，不影响注册登录主流程。
   */
  @Transactional
  public boolean recordReferral(String rawCode, Long inviteeId) {
    Long inviterId = decodeReferralCode(rawCode);
    if (inviterId == null || inviterId.equals(inviteeId)) {
      return false;
    }

    AppUser inviter = userService.findById(inviterId).orElse(null);
    if (!userService.isActive(inviter)) {
      return false;
    }

    Referral referral = new Referral();
    referral.setInviterId(inviterId);
    referral.setInviteeId(inviteeId);
    try {
      referralMapper.insert(referral);
    } catch (DuplicateKeyException ex) {
      return false;
    }

    // 好友通过邀请链接真实注册成功后，给邀请人发放 1 张积分券（3 张可兑换 1 张体验券）。
    experienceVoucherService.issueReferralPoints(
        inviterId, "REF-" + referral.getId(), "邀请好友注册奖励");

    int referralCount = countReferrals(inviterId);
    grantCoupon(inviterId, inviteeId, REFER_COUPON);
    if (referralCount > 0 && referralCount % MILESTONE_EVERY == 0) {
      grantCoupon(inviterId, inviteeId, MILESTONE_COUPON);
    }
    return true;
  }

  public ReferralSummary summary(Long userId) {
    int referralCount = countReferrals(userId);
    int issuedCouponCount = countRewards(userId);
    int nextMilestone = ((referralCount / MILESTONE_EVERY) + 1) * MILESTONE_EVERY;
    int progress = referralCount % MILESTONE_EVERY;

    List<ReferralRewardView> rewards = recentRewards(userId);
    return new ReferralSummary(
        referralCode(userId),
        referralCount,
        issuedCouponCount,
        nextMilestone,
        progress,
        rewards);
  }

  private int countReferrals(Long userId) {
    Long count = referralMapper.selectCount(
        Wrappers.lambdaQuery(Referral.class).eq(Referral::getInviterId, userId));
    return count == null ? 0 : count.intValue();
  }

  private int countRewards(Long userId) {
    Long count = referralRewardMapper.selectCount(
        Wrappers.lambdaQuery(ReferralReward.class).eq(ReferralReward::getInviterId, userId));
    return count == null ? 0 : count.intValue();
  }

  private List<ReferralRewardView> recentRewards(Long userId) {
    List<ReferralReward> rewards = referralRewardMapper.selectList(
        Wrappers.lambdaQuery(ReferralReward.class)
            .eq(ReferralReward::getInviterId, userId)
            .orderByDesc(ReferralReward::getId)
            .last("LIMIT " + REWARD_LIST_LIMIT));
    if (rewards == null || rewards.isEmpty()) {
      return List.of();
    }

    List<ReferralRewardView> views = new ArrayList<>();
    for (ReferralReward reward : rewards) {
      Coupon coupon = couponMapper.selectById(reward.getCouponId());
      AppUser invitee = userService.findById(reward.getInviteeId()).orElse(null);
      views.add(new ReferralRewardView(
          reward.getId(),
          coupon == null ? "优惠券" : coupon.getName(),
          coupon == null ? null : coupon.getValue(),
          coupon == null ? null : coupon.getMinAmount(),
          reward.getCreatedAt() == null ? null : reward.getCreatedAt().toString(),
          invitee == null ? "好友" : displayName(invitee)));
    }
    return views;
  }

  private void grantCoupon(Long inviterId, Long inviteeId, String couponCode) {
    Coupon coupon = usableCoupon(couponCode);
    if (coupon == null) {
      return;
    }

    UserCoupon userCoupon = new UserCoupon();
    userCoupon.setUserId(inviterId);
    userCoupon.setCouponId(coupon.getId());
    userCoupon.setStatus(1);
    userCouponMapper.insert(userCoupon);

    ReferralReward reward = new ReferralReward();
    reward.setInviterId(inviterId);
    reward.setInviteeId(inviteeId);
    reward.setCouponId(coupon.getId());
    reward.setUserCouponId(userCoupon.getId());
    reward.setRewardType(couponCode);
    referralRewardMapper.insert(reward);
  }

  private Coupon usableCoupon(String code) {
    Coupon coupon = couponMapper.selectOne(
        Wrappers.lambdaQuery(Coupon.class)
            .eq(Coupon::getCode, code)
            .eq(Coupon::getDeleted, 0)
            .eq(Coupon::getStatus, 1)
            .last("LIMIT 1"));
    if (coupon == null) {
      return null;
    }
    LocalDateTime now = LocalDateTime.now();
    if (coupon.getValidFrom() == null
        || coupon.getValidTo() == null
        || now.isBefore(coupon.getValidFrom())
        || now.isAfter(coupon.getValidTo())) {
      return null;
    }
    return coupon;
  }

  private static Long decodeReferralCode(String rawCode) {
    if (rawCode == null || rawCode.isBlank()) {
      return null;
    }
    String code = rawCode.trim().toUpperCase(Locale.ROOT);
    if (!code.startsWith("BUZUD")) {
      return null;
    }
    String digits = code.substring("BUZUD".length());
    if (digits.isEmpty()) {
      return null;
    }
    try {
      long id = Long.parseLong(digits);
      return id > 0 ? id : null;
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private static String displayName(AppUser user) {
    String name = user.getName();
    if (name != null && !name.isBlank()) {
      return name;
    }
    String phone = user.getPhone();
    if (phone != null && phone.length() >= 4) {
      return "用户" + phone.substring(phone.length() - 4);
    }
    return "好友";
  }
}
