package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.marketing.MarketingDtos.AccountResponse;
import com.ikea.server.dto.marketing.MarketingDtos.EmailCouponClaimResponse;
import com.ikea.server.dto.marketing.MarketingDtos.RechargeResponse;
import com.ikea.server.dto.marketing.MarketingDtos.ClaimResponse;
import com.ikea.server.dto.marketing.MarketingDtos.CouponView;
import com.ikea.server.dto.marketing.MarketingDtos.RedemptionResponse;
import com.ikea.server.dto.marketing.MarketingDtos.AdminCouponRequest;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.BalanceLog;
import com.ikea.server.entity.Coupon;
import com.ikea.server.entity.EmailCouponClaim;
import com.ikea.server.entity.MemberAccount;
import com.ikea.server.entity.PointLog;
import com.ikea.server.entity.UserCoupon;
import com.ikea.server.mapper.BalanceLogMapper;
import com.ikea.server.mapper.CouponMapper;
import com.ikea.server.mapper.EmailCouponClaimMapper;
import com.ikea.server.mapper.MemberAccountMapper;
import com.ikea.server.mapper.PointLogMapper;
import com.ikea.server.mapper.UserCouponMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MarketingService {

  private static final Logger log = LoggerFactory.getLogger(MarketingService.class);
  private static final Pattern EMAIL =
      Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

  private final CouponMapper couponMapper;
  private final UserCouponMapper userCouponMapper;
  private final MemberAccountMapper memberAccountMapper;
  private final PointLogMapper pointLogMapper;
  private final BalanceLogMapper balanceLogMapper;
  private final EmailCouponClaimMapper emailCouponClaimMapper;
  private final UserService userService;
  private final JavaMailSender mailSender;
  private final String smtpHost;
  private final String emailFrom;

  public MarketingService(
      CouponMapper couponMapper,
      UserCouponMapper userCouponMapper,
      MemberAccountMapper memberAccountMapper,
      PointLogMapper pointLogMapper,
      BalanceLogMapper balanceLogMapper,
      EmailCouponClaimMapper emailCouponClaimMapper,
      UserService userService,
      JavaMailSender mailSender,
      @Value("${spring.mail.host:}") String smtpHost,
      @Value("${ikea.auth.email-from:CHUNG YIP <no-reply@medical-sg.com>}") String emailFrom) {
    this.couponMapper = couponMapper;
    this.userCouponMapper = userCouponMapper;
    this.memberAccountMapper = memberAccountMapper;
    this.pointLogMapper = pointLogMapper;
    this.balanceLogMapper = balanceLogMapper;
    this.emailCouponClaimMapper = emailCouponClaimMapper;
    this.userService = userService;
    this.mailSender = mailSender;
    this.smtpHost = smtpHost;
    this.emailFrom = emailFrom;
  }

  public AccountResponse account(Long userId, BigDecimal subtotal) {
    MemberAccount account = account(userId);
    refreshLevel(account);
    memberAccountMapper.updateById(account);
    return new AccountResponse(
        account.getPoints(),
        account.getBalance(),
        account.getLevel(),
        levelName(account.getLevel()),
        account.getTotalSpent(),
        nextLevelSpend(account.getLevel(), account.getTotalSpent()),
        coupons(userId, subtotal));
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

  /**
   * 扫码领券：以邮箱为领取标识。同一个邮箱对同一张券只登记一次；
   * 若该邮箱已经注册，则同时把券直接放入用户账户。
   */
  @Transactional
  public EmailCouponClaimResponse claimByEmail(String rawEmail, String couponCode) {
    String email = normalizeEmail(rawEmail);
    if (email == null || !EMAIL.matcher(email).matches()) {
      throw new IllegalArgumentException("邮箱格式不正确");
    }
    Coupon coupon = couponByCode(couponCode);
    validateCoupon(coupon);

    boolean alreadyClaimed = findEmailClaim(email, coupon.getId()) != null;
    if (!alreadyClaimed) {
      EmailCouponClaim claim = new EmailCouponClaim();
      claim.setEmail(email);
      claim.setCouponId(coupon.getId());
      claim.setStatus(1);
      try {
        emailCouponClaimMapper.insert(claim);
      } catch (DuplicateKeyException ex) {
        alreadyClaimed = true;
      }
    }

    boolean linkedToAccount = linkClaimedCouponToExistingAccount(email, coupon);
    sendCouponEmail(email, coupon, alreadyClaimed);
    return new EmailCouponClaimResponse(
        coupon.getCode(),
        coupon.getName(),
        alreadyClaimed,
        linkedToAccount,
        claimMessage(alreadyClaimed, linkedToAccount));
  }

  /** 用户在注册/首次登录时，用邮箱领取过的优惠券自动补发到账户。 */
  @Transactional
  public void grantEmailCouponsForUser(String rawEmail, Long userId) {
    String email = normalizeEmail(rawEmail);
    if (email == null || userId == null) {
      return;
    }
    List<EmailCouponClaim> claims =
        emailCouponClaimMapper.selectList(
            Wrappers.lambdaQuery(EmailCouponClaim.class)
                .eq(EmailCouponClaim::getEmail, email)
                .eq(EmailCouponClaim::getStatus, 1));
    for (EmailCouponClaim claim : claims) {
      Coupon coupon = couponMapper.selectById(claim.getCouponId());
      if (coupon == null || !isCouponValid(coupon)) {
        continue;
      }
      Long exists =
          userCouponMapper.selectCount(
              Wrappers.lambdaQuery(UserCoupon.class)
                  .eq(UserCoupon::getUserId, userId)
                  .eq(UserCoupon::getCouponId, coupon.getId())
                  .eq(UserCoupon::getStatus, 1));
      if (exists == null || exists == 0) {
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUserId(userId);
        userCoupon.setCouponId(coupon.getId());
        userCoupon.setStatus(1);
        userCouponMapper.insert(userCoupon);
      }
    }
  }

  public List<Coupon> listCoupons(String keyword, Integer status) {
    var query =
        Wrappers.lambdaQuery(Coupon.class).eq(Coupon::getDeleted, 0);
    if (keyword != null && !keyword.isBlank()) {
      query.and(
          wrapper ->
              wrapper
                  .like(Coupon::getCode, keyword)
                  .or()
                  .like(Coupon::getName, keyword));
    }
    if (status != null) {
      query.eq(Coupon::getStatus, status);
    }
    return couponMapper.selectList(query.orderByDesc(Coupon::getId));
  }

  public Coupon couponById(Long id) {
    Coupon coupon = couponMapper.selectById(id);
    if (coupon == null || coupon.getDeleted() != null && coupon.getDeleted() == 1) {
      throw new IllegalArgumentException("优惠券不存在");
    }
    return coupon;
  }

  public Coupon createCoupon(AdminCouponRequest request) {
    if (request == null || request.type() == null || (request.type() != 1 && request.type() != 2)) {
      throw new IllegalArgumentException("优惠券类型不正确");
    }
    if (request.value() == null || request.value().signum() < 0) {
      throw new IllegalArgumentException("优惠券面额或折扣不能小于 0");
    }
    if (request.minAmount() == null || request.minAmount().signum() < 0) {
      throw new IllegalArgumentException("最低消费金额不能小于 0");
    }
    if (request.status() == null || (request.status() != 0 && request.status() != 1)) {
      throw new IllegalArgumentException("优惠券状态不正确");
    }
    String code = requiredCode(request.code());
    Long codeExists =
        couponMapper.selectCount(
            Wrappers.lambdaQuery(Coupon.class)
                .eq(Coupon::getCode, code)
                .eq(Coupon::getDeleted, 0));
    if (codeExists != null && codeExists > 0) {
      throw new IllegalArgumentException("优惠券编码已存在");
    }
    Coupon coupon = new Coupon();
    coupon.setCode(code);
    coupon.setName(requiredName(request.name()));
    coupon.setType(request.type());
    coupon.setValue(request.value());
    coupon.setMinAmount(request.minAmount());
    coupon.setStatus(request.status());
    coupon.setValidFrom(request.validFrom());
    coupon.setValidTo(request.validTo());
    couponMapper.insert(coupon);
    return coupon;
  }

  @Transactional
  public Coupon updateCoupon(Long id, AdminCouponRequest request) {
    Coupon coupon = couponMapper.selectById(id);
    if (coupon == null || coupon.getDeleted() != null && coupon.getDeleted() == 1) {
      throw new IllegalArgumentException("优惠券不存在");
    }
    String code = requiredCode(request == null ? null : request.code());
    Long codeExists =
        couponMapper.selectCount(
            Wrappers.lambdaQuery(Coupon.class)
                .eq(Coupon::getCode, code)
                .eq(Coupon::getDeleted, 0)
                .ne(Coupon::getId, id));
    if (codeExists != null && codeExists > 0) {
      throw new IllegalArgumentException("优惠券编码已存在");
    }
    if (request.type() == null || (request.type() != 1 && request.type() != 2)) {
      throw new IllegalArgumentException("优惠券类型不正确");
    }
    if (request.value() == null || request.value().signum() < 0) {
      throw new IllegalArgumentException("优惠券面额或折扣不能小于 0");
    }
    if (request.minAmount() == null || request.minAmount().signum() < 0) {
      throw new IllegalArgumentException("最低消费金额不能小于 0");
    }
    if (request.status() == null || (request.status() != 0 && request.status() != 1)) {
      throw new IllegalArgumentException("优惠券状态不正确");
    }

    coupon.setCode(code);
    coupon.setName(requiredName(request.name()));
    coupon.setType(request.type());
    coupon.setValue(request.value());
    coupon.setMinAmount(request.minAmount());
    coupon.setStatus(request.status());
    coupon.setValidFrom(request.validFrom());
    coupon.setValidTo(request.validTo());
    couponMapper.updateById(coupon);
    return coupon;
  }

  @Transactional
  public void deleteCoupon(Long id) {
    Coupon coupon = couponMapper.selectById(id);
    if (coupon == null || coupon.getDeleted() != null && coupon.getDeleted() == 1) {
      throw new IllegalArgumentException("优惠券不存在");
    }
    couponMapper.deleteById(id);
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

  /**
   * 余额充值：mock 模式直接入账，真实支付场景应改为创建充值支付单后回调入账。
   */
  @Transactional
  public RechargeResponse recharge(Long userId, BigDecimal amount) {
    BigDecimal value = money(amount);
    if (value.signum() <= 0) {
      throw new IllegalArgumentException("充值金额必须大于 0");
    }
    MemberAccount account = account(userId);
    account.setBalance(money(account.getBalance().add(value)));
    memberAccountMapper.updateById(account);
    balanceLogMapper.insert(balanceLog(userId, value, "recharge", "余额充值"));
    return new RechargeResponse(account.getBalance());
  }

  /**
   * 订单支付成功后累加积分与累计消费，并按累计消费刷新会员等级。
   */
  @Transactional
  public void earnForPaidOrder(Long userId, BigDecimal paidAmount, String orderNo) {
    if (userId == null || paidAmount == null) {
      return;
    }
    MemberAccount account = account(userId);
    int earned = Math.max(1, paidAmount.setScale(0, RoundingMode.DOWN).intValue());
    account.setPoints(account.getPoints() + earned);
    account.setTotalSpent(money(account.getTotalSpent().add(paidAmount)));
    refreshLevel(account);
    memberAccountMapper.updateById(account);
    pointLogMapper.insert(pointLog(userId, earned, "order", "下单得积分 " + orderNo));
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

  private EmailCouponClaim findEmailClaim(String email, Long couponId) {
    return emailCouponClaimMapper.selectOne(
        Wrappers.lambdaQuery(EmailCouponClaim.class)
            .eq(EmailCouponClaim::getEmail, email)
            .eq(EmailCouponClaim::getCouponId, couponId)
            .eq(EmailCouponClaim::getStatus, 1)
            .last("LIMIT 1"));
  }

  private boolean linkClaimedCouponToExistingAccount(String email, Coupon coupon) {
    AppUser user = userService.findByEmail(email).orElse(null);
    if (user == null) {
      return false;
    }
    Long exists =
        userCouponMapper.selectCount(
            Wrappers.lambdaQuery(UserCoupon.class)
                .eq(UserCoupon::getUserId, user.getId())
                .eq(UserCoupon::getCouponId, coupon.getId())
                .eq(UserCoupon::getStatus, 1));
    if (exists == null || exists == 0) {
      UserCoupon userCoupon = new UserCoupon();
      userCoupon.setUserId(user.getId());
      userCoupon.setCouponId(coupon.getId());
      userCoupon.setStatus(1);
      userCouponMapper.insert(userCoupon);
    }
    return true;
  }

  private void sendCouponEmail(String email, Coupon coupon, boolean alreadyClaimed) {
    if (smtpHost == null || smtpHost.isBlank()) {
      log.warn("SMTP host is not configured; skipping coupon email for {}", email);
      return;
    }
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(emailFrom);
    message.setTo(email);
    message.setSubject(alreadyClaimed ? "您已领取过 BUZUD 优惠券" : "您已领取 BUZUD 优惠券");
    message.setText(
        "优惠券：" + coupon.getName() + "\n"
            + "券码：" + coupon.getCode() + "\n\n"
            + "登录 BUZUD 商城后可在结算时使用。使用该邮箱注册或登录，优惠券会自动到账。");
    try {
      mailSender.send(message);
    } catch (RuntimeException ex) {
      log.error("Failed to send coupon email to {}", email, ex);
    }
  }

  private static String claimMessage(boolean alreadyClaimed, boolean linkedToAccount) {
    if (alreadyClaimed) {
      return "该邮箱已领取过此优惠券，请勿重复领取。";
    }
    if (linkedToAccount) {
      return "优惠券已放入您的账户，登录后即可在结算时使用。";
    }
    return "优惠券已领取。使用该邮箱注册或登录后，优惠券会自动到账。";
  }

  private static String normalizeEmail(String email) {
    return UserService.normalizeAccount(email);
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

  private String requiredCode(String code) {
    String normalized = code == null ? "" : code.trim().toUpperCase();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("优惠券编码不能为空");
    }
    if (normalized.length() > 64) {
      throw new IllegalArgumentException("优惠券编码不能超过 64 位");
    }
    return normalized;
  }

  private String requiredName(String name) {
    String normalized = name == null ? "" : name.trim();
    if (normalized.isBlank()) {
      throw new IllegalArgumentException("优惠券名称不能为空");
    }
    return normalized;
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
    account.setLevel(1);
    account.setTotalSpent(BigDecimal.ZERO);
    memberAccountMapper.insert(account);
    return account;
  }

  private void refreshLevel(MemberAccount account) {
    BigDecimal total = money(account.getTotalSpent());
    int level = total.compareTo(new BigDecimal("1000")) >= 0
        ? 3
        : total.compareTo(new BigDecimal("300")) >= 0 ? 2 : 1;
    account.setLevel(level);
  }

  private static String levelName(int level) {
    return switch (level) {
      case 3 -> "金卡会员";
      case 2 -> "银卡会员";
      default -> "普通会员";
    };
  }

  private static BigDecimal nextLevelSpend(int level, BigDecimal totalSpent) {
    if (level >= 3) {
      return BigDecimal.ZERO;
    }
    BigDecimal threshold = level == 1 ? new BigDecimal("300") : new BigDecimal("1000");
    return money(threshold.subtract(totalSpent).max(BigDecimal.ZERO));
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
