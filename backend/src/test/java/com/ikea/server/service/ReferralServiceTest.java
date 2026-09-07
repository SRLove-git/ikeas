package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.Coupon;
import com.ikea.server.entity.Referral;
import com.ikea.server.entity.ReferralReward;
import com.ikea.server.entity.UserCoupon;
import com.ikea.server.mapper.CouponMapper;
import com.ikea.server.mapper.ReferralMapper;
import com.ikea.server.mapper.ReferralRewardMapper;
import com.ikea.server.mapper.UserCouponMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class ReferralServiceTest {

  private ReferralMapper referralMapper;
  private ReferralRewardMapper referralRewardMapper;
  private CouponMapper couponMapper;
  private UserCouponMapper userCouponMapper;
  private UserService userService;
  private ReferralService referralService;

  @BeforeEach
  void setUp() {
    referralMapper = mock(ReferralMapper.class);
    referralRewardMapper = mock(ReferralRewardMapper.class);
    couponMapper = mock(CouponMapper.class);
    userCouponMapper = mock(UserCouponMapper.class);
    userService = mock(UserService.class);
    referralService =
        new ReferralService(
            referralMapper,
            referralRewardMapper,
            couponMapper,
            userCouponMapper,
            userService);
  }

  @Test
  void recordReferralShouldIssueBaseCoupon() {
    AppUser inviter = user(100L);
    when(userService.findById(100L)).thenReturn(java.util.Optional.of(inviter));
    when(userService.isActive(inviter)).thenReturn(true);
    when(referralMapper.selectCount(any(Wrapper.class))).thenReturn(1L);
    when(couponMapper.selectOne(any(Wrapper.class))).thenReturn(coupon("REFER5"));
    when(userCouponMapper.insert(any(UserCoupon.class)))
        .thenAnswer(
            invocation -> {
              UserCoupon userCoupon = invocation.getArgument(0);
              userCoupon.setId(910001L);
              return 1;
            });

    boolean recorded = referralService.recordReferral("BUZUD100", 200L);

    assertEquals(true, recorded);
    verify(referralMapper).insert(any(Referral.class));

    ArgumentCaptor<ReferralReward> rewardCaptor = ArgumentCaptor.forClass(ReferralReward.class);
    verify(referralRewardMapper).insert(rewardCaptor.capture());
    assertEquals("REFER5", rewardCaptor.getValue().getRewardType());
    assertEquals(910001L, rewardCaptor.getValue().getUserCouponId());
  }

  @Test
  void recordReferralShouldIgnoreInvalidCode() {
    boolean recorded = referralService.recordReferral("not-a-code", 200L);

    assertFalse(recorded);
    verify(referralMapper, org.mockito.Mockito.never()).insert(any(Referral.class));
  }

  @Test
  void summaryShouldExposeCodeAndCounts() {
    when(referralMapper.selectCount(any(Wrapper.class))).thenReturn(3L);
    when(referralRewardMapper.selectCount(any(Wrapper.class))).thenReturn(4L);
    when(referralRewardMapper.selectList(any(Wrapper.class))).thenReturn(List.of());

    var summary = referralService.summary(100L);

    assertEquals("BUZUD100", summary.code());
    assertEquals(3, summary.referralCount());
    assertEquals(4, summary.issuedCouponCount());
    assertEquals(5, summary.nextMilestone());
    assertEquals(3, summary.progress());
    assertEquals(0, summary.rewards().size());
  }

  private static AppUser user(Long id) {
    AppUser user = new AppUser();
    user.setId(id);
    user.setName("用户1234");
    user.setStatus(1);
    return user;
  }

  private static Coupon coupon(String code) {
    Coupon coupon = new Coupon();
    coupon.setId(code.equals("REFER5") ? 9101L : 9102L);
    coupon.setCode(code);
    coupon.setName("测试券");
    coupon.setType(1);
    coupon.setValue(new BigDecimal("5.00"));
    coupon.setMinAmount(new BigDecimal("30.00"));
    coupon.setStatus(1);
    coupon.setDeleted(0);
    coupon.setValidFrom(LocalDateTime.now().minusDays(1));
    coupon.setValidTo(LocalDateTime.now().plusDays(365));
    return coupon;
  }
}
