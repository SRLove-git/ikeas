package com.ikea.server.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminCreateVouchersRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.AdminUpdateVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherResponse;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherResponse;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.mapper.ExperienceVoucherMapper;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 线下印刷实体体检券：后台录入券码，前台预约时校验并核销。 */
@Service
public class ExperienceVoucherService {

  private final ExperienceVoucherMapper voucherMapper;

  public ExperienceVoucherService(ExperienceVoucherMapper voucherMapper) {
    this.voucherMapper = voucherMapper;
  }

  public List<ExperienceVoucher> listVouchers(String keyword, Integer status) {
    var query =
        Wrappers.lambdaQuery(ExperienceVoucher.class).eq(ExperienceVoucher::getDeleted, 0);
    if (keyword != null && !keyword.isBlank()) {
      query.like(ExperienceVoucher::getCode, keyword.trim().toUpperCase());
    }
    if (status != null) {
      query.eq(ExperienceVoucher::getStatus, status);
    }
    return voucherMapper.selectList(query.orderByDesc(ExperienceVoucher::getCreatedAt));
  }

  @Transactional
  public List<ExperienceVoucher> createVouchers(AdminCreateVouchersRequest request) {
    List<String> codes = normalizeCodes(request == null ? null : request.codes());
    if (codes.isEmpty()) {
      throw new IllegalArgumentException("请输入至少一个体检券码");
    }

    String remark = normalizeRemark(request == null ? null : request.remark());
    List<ExperienceVoucher> created = new ArrayList<>();
    for (String code : codes) {
      Long exists =
          voucherMapper.selectCount(
              Wrappers.lambdaQuery(ExperienceVoucher.class)
                  .eq(ExperienceVoucher::getCode, code)
                  .eq(ExperienceVoucher::getDeleted, 0));
      if (exists != null && exists > 0) {
        continue;
      }
      ExperienceVoucher voucher = new ExperienceVoucher();
      voucher.setCode(code);
      voucher.setStatus(0);
      voucher.setRemark(remark);
      voucherMapper.insert(voucher);
      created.add(voucher);
    }
    return created;
  }

  @Transactional
  public void updateStatus(Long id, Integer status) {
    if (status == null || (status != 0 && status != 2)) {
      throw new IllegalArgumentException("体检券状态不正确");
    }
    ExperienceVoucher voucher = voucherMapper.selectById(id);
    if (voucher == null || voucher.getDeleted() != null && voucher.getDeleted() == 1) {
      throw new IllegalArgumentException("体检券不存在");
    }
    if (voucher.getStatus() != null && voucher.getStatus() == 1) {
      throw new IllegalArgumentException("体检券已使用，不能修改状态");
    }
    voucher.setStatus(status);
    voucherMapper.updateById(voucher);
  }

  @Transactional
  public ExperienceVoucher updateVoucher(Long id, AdminUpdateVoucherRequest request) {
    ExperienceVoucher voucher = voucherMapper.selectById(id);
    if (voucher == null || voucher.getDeleted() != null && voucher.getDeleted() == 1) {
      throw new IllegalArgumentException("体检券不存在");
    }
    if (request == null) {
      return voucher;
    }
    if (request.remark() != null) {
      voucher.setRemark(normalizeRemark(request.remark()));
    }
    if (request.status() != null) {
      if (request.status() != 0 && request.status() != 2) {
        throw new IllegalArgumentException("体检券状态不正确");
      }
      if (voucher.getStatus() != null && voucher.getStatus() == 1) {
        throw new IllegalArgumentException("体检券已使用，不能修改状态");
      }
      voucher.setStatus(request.status());
    }
    voucherMapper.updateById(voucher);
    return voucher;
  }

  @Transactional
  public void deleteVoucher(Long id) {
    ExperienceVoucher voucher = voucherMapper.selectById(id);
    if (voucher == null || voucher.getDeleted() != null && voucher.getDeleted() == 1) {
      throw new IllegalArgumentException("体检券不存在");
    }
    if (voucher.getStatus() != null && voucher.getStatus() == 1) {
      throw new IllegalArgumentException("体检券已使用，不能删除");
    }
    voucherMapper.deleteById(id);
  }

  public ValidateVoucherResponse validate(String code) {
    ExperienceVoucher voucher = voucherByCode(code);
    boolean valid = voucher != null && voucher.getStatus() != null && voucher.getStatus() == 0;
    return new ValidateVoucherResponse(
        voucher == null ? normalizeCode(code) : voucher.getCode(), valid);
  }

  @Transactional
  public RedeemVoucherResponse redeem(String code, String bookingId) {
    String normalizedCode = normalizeCode(code);
    if (normalizedCode.isBlank()) {
      throw new IllegalArgumentException("请输入体检券码");
    }
    String safeBookingId = normalizeBookingId(bookingId);
    if (safeBookingId.isBlank()) {
      throw new IllegalArgumentException("预约编号不能为空");
    }

    ExperienceVoucher voucher = voucherByCode(normalizedCode);
    if (voucher == null || voucher.getStatus() == null || voucher.getStatus() == 2) {
      throw new IllegalArgumentException("体检券不存在或已停用");
    }
    if (voucher.getStatus() == 1) {
      if (safeBookingId.equals(voucher.getUsedBookingId())) {
        return new RedeemVoucherResponse(voucher.getCode(), voucher.getUsedBookingId());
      }
      throw new IllegalArgumentException("体检券已使用");
    }

    voucher.setStatus(1);
    voucher.setUsedBookingId(safeBookingId);
    voucher.setUsedAt(LocalDateTime.now(ZoneOffset.UTC));
    voucherMapper.updateById(voucher);
    return new RedeemVoucherResponse(voucher.getCode(), voucher.getUsedBookingId());
  }

  /** 预约下单时校验并核销体检券，参与调用方事务，券无效则整体回滚。 */
  @Transactional
  public void redeemForBooking(String code, String bookingNo) {
    ExperienceVoucher voucher = voucherByCode(code);
    if (voucher == null || voucher.getStatus() == null || voucher.getStatus() == 2) {
      throw new IllegalArgumentException("体检券不存在或已停用");
    }
    if (voucher.getStatus() == 1) {
      throw new IllegalArgumentException("体检券已使用");
    }
    voucher.setStatus(1);
    voucher.setUsedBookingId(normalizeBookingId(bookingNo));
    voucher.setUsedAt(LocalDateTime.now(ZoneOffset.UTC));
    voucherMapper.updateById(voucher);
  }

  /** 预约取消或删除时释放被占用的体检券，找不到则静默忽略。 */
  @Transactional
  public void releaseByBookingId(String bookingNo) {
    String safeBookingNo = normalizeBookingId(bookingNo);
    if (safeBookingNo.isBlank()) {
      return;
    }
    // updateById 的 NOT_NULL 字段策略清不掉 usedBookingId/usedAt，改用 wrapper 显式置空
    voucherMapper.update(
        null,
        Wrappers.lambdaUpdate(ExperienceVoucher.class)
            .eq(ExperienceVoucher::getUsedBookingId, safeBookingNo)
            .eq(ExperienceVoucher::getStatus, 1)
            .eq(ExperienceVoucher::getDeleted, 0)
            .set(ExperienceVoucher::getStatus, 0)
            .set(ExperienceVoucher::getUsedBookingId, null)
            .set(ExperienceVoucher::getUsedAt, null));
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

  private String normalizeBookingId(String bookingId) {
    return bookingId == null ? "" : bookingId.trim();
  }

  private ExperienceVoucher voucherByCode(String code) {
    String normalized = normalizeCode(code);
    return voucherMapper.selectOne(
        Wrappers.lambdaQuery(ExperienceVoucher.class)
            .eq(ExperienceVoucher::getCode, normalized)
            .eq(ExperienceVoucher::getDeleted, 0)
            .last("LIMIT 1"));
  }
}
