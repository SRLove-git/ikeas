package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.marketing.MarketingDtos.AccountResponse;
import com.ikea.server.dto.marketing.MarketingDtos.ClaimResponse;
import com.ikea.server.dto.marketing.MarketingDtos.CouponView;
import com.ikea.server.dto.marketing.MarketingDtos.RedemptionResponse;
import com.ikea.server.dto.marketing.MarketingDtos.AdminCouponRequest;
import com.ikea.server.entity.BalanceLog;
import com.ikea.server.entity.Coupon;
import com.ikea.server.entity.MemberAccount;
import com.ikea.server.entity.PointLog;
import com.ikea.server.entity.UserCoupon;
import com.ikea.server.mapper.BalanceLogMapper;
import com.ikea.server.mapper.CouponMapper;
import com.ikea.server.mapper.MemberAccountMapper;
import com.ikea.server.mapper.PointLogMapper;
import com.ikea.server.mapper.UserCouponMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketingService {

  private final CouponMapper couponMapper;
  private final UserCouponMapper userCouponMapper;
  private final MemberAccountMapper memberAccountMapper;
  private final PointLogMapper pointLogMapper;
  private final BalanceLogMapper balanceLogMapper;

  public MarketingService(
      CouponMapper couponMapper,
      UserCouponMapper userCouponMapper,
      MemberAccountMapper memberAccountMapper,
      PointLogMapper pointLogMapper,
      BalanceLogMapper balanceLogMapper) {
    this.couponMapper = couponMapper;
    this.userCouponMapper = userCouponMapper;
    this.memberAccountMapper = memberAccountMapper;
    this.pointLogMapper = pointLogMapper;
    this.balanceLogMapper = balanceLogMapper;
  }

  public AccountResponse account(Long userId, BigDecimal subtotal) {
    MemberAccount account = account(userId);
    return new AccountResponse(account.getPoints(), account.getBalance(), coupons(userId, subtotal));
  }

  public ClaimResponse claim(Long userId, String code) {
    Coupon coupon = couponByCode(code);
    validateCoupon(coupon);
    Long exists = userCouponMapper.selectCount(Wrappers.lambdaQuery(UserCoupon.class)
        .eq(UserCoupon::getUserId, userId)
        .eq(UserCoupon::getCouponId, coupon.getId())
        .eq(UserCoupon::getStatus, 1));
    if (exists > 0) {
      throw new IllegalArgumentException("优惠券已领取");
    }
    UserCoupon userCoupon = new UserCoupon();
    userCoupon.setUserId(userId);
    userCoupon.setCouponId(coupon.getId());
    userCoupon.setStatus(1);
    userCouponMapper.insert(userCoupon);
    return new ClaimResponse(coupon.getCode(), coupon.getName());
  }

  public List<Coupon> listCoupons() {
    return couponMapper.selectList(Wrappers.lambdaQuery(Coupon.class)
        .eq(Coupon::getDeleted, 0)
        .orderByDesc(Coupon::getId));
  }

  public Coupon createCoupon(AdminCouponRequest request) {
    Coupon coupon = new Coupon();
    coupon.setCode(request.code());
    coupon.setName(request.name());
    coupon.setType(request.type() == null ? 1 : request.type());
    coupon.setValue(request.value() == null ? BigDecimal.ZERO : request.value());
    coupon.setMinAmount(request.minAmount() == null ? BigDecimal.ZERO : request.minAmount());
    coupon.setStatus(request.status() == null ? 1 : request.status());
    coupon.setValidFrom(request.validFrom());
    coupon.setValidTo(request.validTo());
    couponMapper.insert(coupon);
    return coupon;
  }

  public void updateCouponStatus(Long couponId, Integer status) {
    Coupon coupon = couponMapper.selectById(couponId);
    if (coupon == null) {
      throw new IllegalArgumentException("优惠券不存在");
    }
    coupon.setStatus(status == null ? 0 : status);
    couponMapper.updateById(coupon);
  }

  public MemberAccount adjustAccount(Long userId, Integer pointsDelta, BigDecimal balanceDelta) {
    MemberAccount account = account(userId);
    int points = pointsDelta == null ? 0 : pointsDelta;
    BigDecimal balance = money(balanceDelta);
    account.setPoints(Math.max(0, account.getPoints() + points));
    account.setBalance(money(account.getBalance().add(balance)));
    if (account.getBalance().signum() < 0) {
      account.setBalance(BigDecimal.ZERO);
    }
    memberAccountMapper.updateById(account);
    if (points != 0) {
      pointLogMapper.insert(pointLog(userId, points, "admin", "管理后台调整"));
    }
    if (balance.signum() != 0) {
      balanceLogMapper.insert(balanceLog(userId, balance, "admin", "管理后台调整"));
    }
    return account;
  }

  @Transactional
  public RedemptionResponse applyOrder(
      Long userId,
      String couponCode,
      Integer usePoints,
      BigDecimal useBalance,
      BigDecimal subtotal,
      String orderNo) {
    BigDecimal safeSubtotal = money(subtotal);
    BigDecimal couponDiscount = BigDecimal.ZERO;
    BigDecimal pointDiscount = BigDecimal.ZERO;
    BigDecimal balanceUsed = BigDecimal.ZERO;

    MemberAccount account = account(userId);
    if (couponCode != null && !couponCode.isBlank()) {
      Coupon coupon = couponByCode(couponCode);
      UserCoupon userCoupon = userCouponMapper.selectOne(Wrappers.lambdaQuery(UserCoupon.class)
          .eq(UserCoupon::getUserId, userId)
          .eq(UserCoupon::getCouponId, coupon.getId())
          .eq(UserCoupon::getStatus, 1)
          .last("LIMIT 1"));
      if (userCoupon == null) {
        throw new IllegalArgumentException("优惠券不可用或未领取");
      }
      couponDiscount = discount(coupon, safeSubtotal);
      userCoupon.setStatus(2);
      userCoupon.setUsedOrderNo(orderNo);
      userCouponMapper.updateById(userCoupon);
    }

    BigDecimal remaining = safeSubtotal.subtract(couponDiscount);
    int requestedPoints = usePoints == null ? 0 : Math.max(0, usePoints);
    if (requestedPoints > 0) {
      if (account.getPoints() < requestedPoints) {
        throw new IllegalArgumentException("积分不足");
      }
      pointDiscount = BigDecimal.valueOf(requestedPoints)
          .multiply(new BigDecimal("0.01"))
          .min(remaining);
      account.setPoints(account.getPoints() - requestedPoints);
      pointLogMapper.insert(pointLog(userId, -requestedPoints, "order", "下单抵扣 " + orderNo));
    }

    remaining = remaining.subtract(pointDiscount);
    BigDecimal requestedBalance = money(useBalance);
    if (requestedBalance.signum() > 0) {
      if (account.getBalance().compareTo(requestedBalance) < 0) {
        throw new IllegalArgumentException("余额不足");
      }
      balanceUsed = requestedBalance.min(remaining);
      account.setBalance(account.getBalance().subtract(balanceUsed));
      balanceLogMapper.insert(balanceLog(userId, balanceUsed.negate(), "order", "下单抵扣 " + orderNo));
    }
    memberAccountMapper.updateById(account);

    BigDecimal totalDiscount = couponDiscount.add(pointDiscount).add(balanceUsed);
    return new RedemptionResponse(couponDiscount, pointDiscount, balanceUsed, money(totalDiscount));
  }

  private List<CouponView> coupons(Long userId, BigDecimal subtotal) {
    List<UserCoupon> owned = userCouponMapper.selectList(Wrappers.lambdaQuery(UserCoupon.class)
        .eq(UserCoupon::getUserId, userId)
        .eq(UserCoupon::getStatus, 1));
    if (owned.isEmpty()) {
      return List.of();
    }
    List<CouponView> views = new ArrayList<>();
    for (UserCoupon userCoupon : owned) {
      Coupon coupon = couponMapper.selectById(userCoupon.getCouponId());
      if (coupon == null || !isCouponValid(coupon)) {
        continue;
      }
      views.add(new CouponView(
          coupon.getId(),
          coupon.getCode(),
          coupon.getName(),
          coupon.getType(),
          coupon.getValue(),
          coupon.getMinAmount(),
          userCoupon.getStatus(),
          money(subtotal).compareTo(coupon.getMinAmount()) >= 0 ? discount(coupon, money(subtotal)) : BigDecimal.ZERO));
    }
    return views;
  }

  private BigDecimal discount(Coupon coupon, BigDecimal subtotal) {
    if (coupon.getType() == 2) {
      return subtotal.multiply(coupon.getValue()).divide(new BigDecimal("100"), 2, RoundingMode.DOWN);
    }
    return coupon.getValue().min(subtotal);
  }

  private Coupon couponByCode(String code) {
    Coupon coupon = couponMapper.selectOne(Wrappers.lambdaQuery(Coupon.class)
        .eq(Coupon::getCode, code)
        .eq(Coupon::getDeleted, 0)
        .last("LIMIT 1"));
    if (coupon == null) {
      throw new IllegalArgumentException("优惠券不存在");
    }
    return coupon;
  }

  private void validateCoupon(Coupon coupon) {
    if (!isCouponValid(coupon)) {
      throw new IllegalArgumentException("优惠券不在有效期内或已停用");
    }
  }

  private boolean isCouponValid(Coupon coupon) {
    LocalDateTime now = LocalDateTime.now();
    return coupon.getStatus() != null && coupon.getStatus() == 1
        && !now.isBefore(coupon.getValidFrom())
        && !now.isAfter(coupon.getValidTo());
  }

  private MemberAccount account(Long userId) {
    MemberAccount account = memberAccountMapper.selectById(userId);
    if (account != null) {
      return account;
    }
    account = new MemberAccount();
    account.setUserId(userId);
    account.setPoints(0);
    account.setBalance(BigDecimal.ZERO);
    memberAccountMapper.insert(account);
    return account;
  }

  private PointLog pointLog(Long userId, int amount, String type, String remark) {
    PointLog log = new PointLog();
    log.setUserId(userId);
    log.setChangeAmount(amount);
    log.setType(type);
    log.setRemark(remark);
    return log;
  }

  private BalanceLog balanceLog(Long userId, BigDecimal amount, String type, String remark) {
    BalanceLog log = new BalanceLog();
    log.setUserId(userId);
    log.setChangeAmount(amount);
    log.setType(type);
    log.setRemark(remark);
    return log;
  }

  private static BigDecimal money(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
  }
}
