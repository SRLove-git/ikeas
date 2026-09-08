package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminCreateVouchersRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminGenerateVouchersRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminUpdateVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherResponse;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherResponse;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.mapper.ExperienceVoucherMapper;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 线下印刷实体券：1=体验券，2=积分券。积分券支持订单自动发放与 3 张合并兑换。 */
@Service
public class ExperienceVoucherService {

  public static final int TYPE_EXPERIENCE = 1;
  public static final int TYPE_POINTS = 2;

  public static final int STATUS_UNUSED = 0;
  public static final int STATUS_USED = 1;
  public static final int STATUS_DISABLED = 2;
  public static final int STATUS_INVALID = 3;

  private static final BigDecimal POINTS_ISSUE_THRESHOLD = new BigDecimal("60.00");
  private static final DateTimeFormatter BATCH_TIME = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
  private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final SecureRandom RANDOM = new SecureRandom();

  private final ExperienceVoucherMapper voucherMapper;
  private final VoucherPdfService voucherPdfService;
  private final String bookingUrl;

  public ExperienceVoucherService(
      ExperienceVoucherMapper voucherMapper,
      VoucherPdfService voucherPdfService,
      @Value("${ikea.voucher.booking-url:https://medical-sg.com/en/booking/}") String bookingUrl) {
    this.voucherMapper = voucherMapper;
    this.voucherPdfService = voucherPdfService;
    this.bookingUrl =
        bookingUrl == null || bookingUrl.isBlank() ? "https://medical-sg.com/en/booking/" : bookingUrl;
  }

  public List<ExperienceVoucher> listVouchers(String keyword, Integer status, Integer type) {
    var query =
        Wrappers.lambdaQuery(ExperienceVoucher.class).eq(ExperienceVoucher::getDeleted, 0);
    if (keyword != null && !keyword.isBlank()) {
      query.like(ExperienceVoucher::getCode, keyword.trim().toUpperCase());
    }
    if (status != null) {
      query.eq(ExperienceVoucher::getStatus, status);
    }
    if (type != null) {
      query.eq(ExperienceVoucher::getType, type);
    }
    return voucherMapper.selectList(query.orderByDesc(ExperienceVoucher::getCreatedAt));
  }

  public List<ExperienceVoucher> listUserVouchers(Long userId) {
    return voucherMapper.selectList(
        Wrappers.lambdaQuery(ExperienceVoucher.class)
            .eq(ExperienceVoucher::getUserId, userId)
            .eq(ExperienceVoucher::getDeleted, 0)
            .orderByAsc(ExperienceVoucher::getStatus)
            .orderByDesc(ExperienceVoucher::getCreatedAt));
  }

  @Transactional
  public List<ExperienceVoucher> createVouchers(AdminCreateVouchersRequest request) {
    List<String> codes = normalizeCodes(request == null ? null : request.codes());
    if (codes.isEmpty()) {
      throw new IllegalArgumentException("请输入至少一个券码");
    }

    int type = normalizeType(request == null ? null : request.type());
    String remark = normalizeRemark(request == null ? null : request.remark());
    String batchNo = normalizeBatchNo(request == null ? null : request.batchNo());
    LocalDateTime validUntil = request == null ? null : request.validUntil();
    List<ExperienceVoucher> created = new ArrayList<>();
    for (String code : codes) {
      if (exists(code)) {
        continue;
      }
      ExperienceVoucher voucher = newVoucher(type, code, remark, validUntil, batchNo);
      voucherMapper.insert(voucher);
      created.add(voucher);
    }
    return created;
  }

  @Transactional
  public List<ExperienceVoucher> generateVouchers(AdminGenerateVouchersRequest request) {
    int type = normalizeType(request == null ? null : request.type());
    int count = request == null || request.count() == null ? 0 : request.count();
    if (count <= 0 || count > 1000) {
      throw new IllegalArgumentException("生成数量必须在 1 到 1000 之间");
    }
    String remark = "系统批量生成";
    String batchNo =
        normalizeBatchNo(request == null ? null : request.batchNo());
    if (batchNo.isBlank()) {
      batchNo = "GEN-" + BATCH_TIME.format(LocalDateTime.now(ZoneOffset.UTC));
    }
    LocalDateTime validUntil = request == null ? null : request.validUntil();
    List<ExperienceVoucher> created = new ArrayList<>();
    for (int i = 0; i < count; i++) {
      String code = newUniqueCode(type);
      ExperienceVoucher voucher = newVoucher(type, code, remark, validUntil, batchNo);
      voucherMapper.insert(voucher);
      created.add(voucher);
    }
    return created;
  }

  @Transactional
  public void updateStatus(Long id, Integer status) {
    if (status == null || (status != STATUS_UNUSED && status != STATUS_DISABLED)) {
      throw new IllegalArgumentException("券状态不正确");
    }
    ExperienceVoucher voucher = requireVoucher(id);
    if (voucher.getStatus() != null && voucher.getStatus() == STATUS_USED) {
      throw new IllegalArgumentException("券已使用，不能修改状态");
    }
    voucher.setStatus(status);
    voucherMapper.updateById(voucher);
  }

  @Transactional
  public ExperienceVoucher updateVoucher(Long id, AdminUpdateVoucherRequest request) {
    ExperienceVoucher voucher = requireVoucher(id);
    if (request == null) {
      return voucher;
    }
    if (request.remark() != null) {
      voucher.setRemark(normalizeRemark(request.remark()));
    }
    if (request.batchNo() != null) {
      voucher.setBatchNo(normalizeBatchNo(request.batchNo()));
    }
    if (request.validUntil() != null) {
      voucher.setValidUntil(request.validUntil());
    }
    if (request.status() != null) {
      if (request.status() != STATUS_UNUSED && request.status() != STATUS_DISABLED) {
        throw new IllegalArgumentException("券状态不正确");
      }
      if (voucher.getStatus() != null && voucher.getStatus() == STATUS_USED) {
        throw new IllegalArgumentException("券已使用，不能修改状态");
      }
      voucher.setStatus(request.status());
    }
    voucherMapper.updateById(voucher);
    return voucher;
  }

  @Transactional
  public void deleteVoucher(Long id) {
    ExperienceVoucher voucher = requireVoucher(id);
    if (voucher.getStatus() != null && voucher.getStatus() == STATUS_USED) {
      throw new IllegalArgumentException("券已使用，不能删除");
    }
    voucherMapper.deleteById(id);
  }

  public ValidateVoucherResponse validate(String code) {
    ExperienceVoucher voucher = voucherByCode(code);
    boolean valid =
        voucher != null
            && voucher.getStatus() != null
            && voucher.getStatus() == STATUS_UNUSED;
    return new ValidateVoucherResponse(
        voucher == null ? normalizeCode(code) : voucher.getCode(),
        valid,
        voucher == null ? null : voucher.getType(),
        voucher == null ? null : voucher.getStatus());
  }

  @Transactional
  public RedeemVoucherResponse redeem(String code, String bookingId) {
    String normalizedCode = normalizeCode(code);
    if (normalizedCode.isBlank()) {
      throw new IllegalArgumentException("请输入券码");
    }
    ExperienceVoucher voucher = redeemSingle(normalizedCode, normalizeBookingId(bookingId));
    return new RedeemVoucherResponse(voucher.getCode(), voucher.getUsedBookingId());
  }

  /** 预约下单时核销单张体验券。 */
  @Transactional
  public void redeemForBooking(String code, String bookingNo) {
    String normalizedCode = normalizeCode(code);
    ExperienceVoucher voucher = voucherByCode(normalizedCode);
    if (voucher == null || voucher.getType() == null || voucher.getType() != TYPE_EXPERIENCE) {
      throw new IllegalArgumentException("体验券不存在或类型不正确");
    }
    redeemSingle(normalizedCode, normalizeBookingId(bookingNo));
  }

  /** 预约下单时合并核销 3 张积分券。 */
  @Transactional
  public String redeemPointVouchersForBooking(List<String> codes, String bookingNo) {
    List<String> normalized = normalizeCodes(codes);
    if (normalized.size() != 3) {
      throw new IllegalArgumentException("兑换免费体验需要 3 张积分券");
    }
    String safeBookingNo = normalizeBookingId(bookingNo);
    if (safeBookingNo.isBlank()) {
      throw new IllegalArgumentException("预约编号不能为空");
    }

    List<ExperienceVoucher> vouchers = new ArrayList<>();
    for (String code : normalized) {
      ExperienceVoucher voucher = voucherByCode(code);
      if (voucher == null
          || voucher.getType() == null
          || voucher.getType() != TYPE_POINTS
          || voucher.getStatus() == null
          || voucher.getStatus() != STATUS_UNUSED) {
        throw new IllegalArgumentException("积分券 " + code + " 不可用");
      }
      vouchers.add(voucher);
    }

    for (ExperienceVoucher voucher : vouchers) {
      voucher.setStatus(STATUS_USED);
      voucher.setUsedBookingId(safeBookingNo);
      voucher.setUsedAt(LocalDateTime.now(ZoneOffset.UTC));
      voucherMapper.updateById(voucher);
    }
    return String.join(",", normalized);
  }

  /** 支付成功后为满 S$60 的订单发放一张积分券，重复调用幂等。 */
  @Transactional
  public ExperienceVoucher issuePointVoucherForOrder(
      Long userId, String orderNo, BigDecimal totalAmount) {
    String safeOrderNo = normalizeOrderNo(orderNo);
    if (safeOrderNo.isBlank()) {
      throw new IllegalArgumentException("订单编号不能为空");
    }
    BigDecimal amount = totalAmount == null ? BigDecimal.ZERO : totalAmount;
    if (amount.compareTo(POINTS_ISSUE_THRESHOLD) < 0) {
      return null;
    }

    ExperienceVoucher existing =
        voucherMapper.selectOne(
            Wrappers.lambdaQuery(ExperienceVoucher.class)
                .eq(ExperienceVoucher::getOrderNo, safeOrderNo)
                .eq(ExperienceVoucher::getType, TYPE_POINTS)
                .eq(ExperienceVoucher::getDeleted, 0)
                .last("LIMIT 1"));
    if (existing != null) {
      return existing;
    }

    ExperienceVoucher voucher =
        newVoucher(
            TYPE_POINTS,
            newUniqueCode(TYPE_POINTS),
            "满 S$60 随订单赠送",
            null,
            "ORDER-" + safeOrderNo);
    voucher.setUserId(userId);
    voucher.setOrderNo(safeOrderNo);
    voucherMapper.insert(voucher);
    return voucher;
  }

  /** 订单退款或作废后，将对应未使用积分券置为已作废。 */
  @Transactional
  public int invalidateByOrderNo(String orderNo) {
    String safeOrderNo = normalizeOrderNo(orderNo);
    if (safeOrderNo.isBlank()) {
      return 0;
    }
    return voucherMapper.update(
        null,
        Wrappers.lambdaUpdate(ExperienceVoucher.class)
            .eq(ExperienceVoucher::getOrderNo, safeOrderNo)
            .eq(ExperienceVoucher::getType, TYPE_POINTS)
            .eq(ExperienceVoucher::getStatus, STATUS_UNUSED)
            .eq(ExperienceVoucher::getDeleted, 0)
            .set(ExperienceVoucher::getStatus, STATUS_INVALID));
  }

  /** 预约取消或删除时释放被占用的券，找不到则静默忽略。 */
  @Transactional
  public void releaseByBookingId(String bookingNo) {
    String safeBookingNo = normalizeBookingId(bookingNo);
    if (safeBookingNo.isBlank()) {
      return;
    }
    voucherMapper.update(
        null,
        Wrappers.lambdaUpdate(ExperienceVoucher.class)
            .eq(ExperienceVoucher::getUsedBookingId, safeBookingNo)
            .eq(ExperienceVoucher::getStatus, STATUS_USED)
            .eq(ExperienceVoucher::getDeleted, 0)
            .set(ExperienceVoucher::getStatus, STATUS_UNUSED)
            .set(ExperienceVoucher::getUsedBookingId, null)
            .set(ExperienceVoucher::getUsedAt, null));
  }

  public List<ExperienceVoucher> vouchersByCodes(List<String> codes) {
    List<String> normalized = normalizeCodes(codes);
    if (normalized.isEmpty()) {
      return List.of();
    }
    return voucherMapper.selectList(
        Wrappers.lambdaQuery(ExperienceVoucher.class)
            .in(ExperienceVoucher::getCode, normalized)
            .eq(ExperienceVoucher::getDeleted, 0));
  }

  public byte[] generatePdf(List<String> codes) {
    List<ExperienceVoucher> vouchers = vouchersByCodes(codes);
    if (vouchers.isEmpty()) {
      throw new IllegalArgumentException("未找到可生成的券");
    }
    return voucherPdfService.generate(vouchers);
  }

  public String pdfFilename(List<String> codes) {
    return voucherPdfService.filename(vouchersByCodes(codes));
  }

  private ExperienceVoucher redeemSingle(String normalizedCode, String safeBookingId) {
    if (safeBookingId.isBlank()) {
      throw new IllegalArgumentException("预约编号不能为空");
    }
    ExperienceVoucher voucher = voucherByCode(normalizedCode);
    if (voucher == null
        || voucher.getStatus() == null
        || voucher.getStatus() == STATUS_DISABLED
        || voucher.getStatus() == STATUS_INVALID) {
      throw new IllegalArgumentException("券不存在或已停用");
    }
    if (voucher.getStatus() == STATUS_USED) {
      if (safeBookingId.equals(voucher.getUsedBookingId())) {
        return voucher;
      }
      throw new IllegalArgumentException("券已使用");
    }
    voucher.setStatus(STATUS_USED);
    voucher.setUsedBookingId(safeBookingId);
    voucher.setUsedAt(LocalDateTime.now(ZoneOffset.UTC));
    voucherMapper.updateById(voucher);
    return voucher;
  }

  private ExperienceVoucher newVoucher(
      int type,
      String code,
      String remark,
      LocalDateTime validUntil,
      String batchNo) {
    ExperienceVoucher voucher = new ExperienceVoucher();
    voucher.setCode(code);
    voucher.setType(type);
    voucher.setStatus(STATUS_UNUSED);
    voucher.setRemark(remark);
    voucher.setValidUntil(validUntil);
    voucher.setBatchNo(batchNo);
    voucher.setQrContent(bookingUrlFor(code));
    return voucher;
  }

  private ExperienceVoucher requireVoucher(Long id) {
    ExperienceVoucher voucher = voucherMapper.selectById(id);
    if (voucher == null || voucher.getDeleted() != null && voucher.getDeleted() == 1) {
      throw new IllegalArgumentException("券不存在");
    }
    return voucher;
  }

  private boolean exists(String code) {
    Long count =
        voucherMapper.selectCount(
            Wrappers.lambdaQuery(ExperienceVoucher.class)
                .eq(ExperienceVoucher::getCode, code)
                .eq(ExperienceVoucher::getDeleted, 0));
    return count != null && count > 0;
  }

  private ExperienceVoucher voucherByCode(String code) {
    String normalized = normalizeCode(code);
    return voucherMapper.selectOne(
        Wrappers.lambdaQuery(ExperienceVoucher.class)
            .eq(ExperienceVoucher::getCode, normalized)
            .eq(ExperienceVoucher::getDeleted, 0)
            .last("LIMIT 1"));
  }

  private String newUniqueCode(int type) {
    for (int attempt = 0; attempt < 20; attempt++) {
      String code = generateCode(type);
      if (!exists(code)) {
        return code;
      }
    }
    throw new IllegalStateException("无法生成唯一券码");
  }

  private String generateCode(int type) {
    String prefix = type == TYPE_POINTS ? "BZP" : "BZE";
    return prefix
        + "-"
        + BATCH_TIME.format(LocalDateTime.now(ZoneOffset.UTC))
        + "-"
        + randomCode(6);
  }

  private String randomCode(int length) {
    StringBuilder value = new StringBuilder();
    for (int i = 0; i < length; i++) {
      value.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
    }
    return value.toString();
  }

  private List<String> normalizeCodes(List<String> rawCodes) {
    LinkedHashSet<String> unique = new LinkedHashSet<>();
    if (rawCodes == null) {
      return List.of();
    }
    for (String raw : rawCodes) {
      if (raw == null) {
        continue;
      }
      String normalized = normalizeCode(raw);
      if (!normalized.isBlank()) {
        unique.add(normalized);
      }
    }
    return new ArrayList<>(unique);
  }

  private String normalizeCode(String code) {
    return code == null ? "" : code.trim().toUpperCase();
  }

  private String normalizeRemark(String remark) {
    return remark == null ? "" : remark.trim();
  }

  private String normalizeBatchNo(String batchNo) {
    return batchNo == null ? "" : batchNo.trim();
  }

  private String normalizeBookingId(String bookingId) {
    return bookingId == null ? "" : bookingId.trim();
  }

  private String normalizeOrderNo(String orderNo) {
    return orderNo == null ? "" : orderNo.trim();
  }

  private int normalizeType(Integer type) {
    int normalized = type == null ? TYPE_EXPERIENCE : type;
    if (normalized != TYPE_EXPERIENCE && normalized != TYPE_POINTS) {
      throw new IllegalArgumentException("券类型不正确");
    }
    return normalized;
  }

  private String bookingUrlFor(String code) {
    return bookingUrl
        + (bookingUrl.contains("?") ? "&" : "?")
        + "voucher="
        + java.net.URLEncoder.encode(code, java.nio.charset.StandardCharsets.UTF_8);
  }
}
