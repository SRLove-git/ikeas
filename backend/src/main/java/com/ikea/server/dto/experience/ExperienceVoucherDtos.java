package com.ikea.server.dto.experience;

import java.time.LocalDateTime;
import java.util.List;

public final class ExperienceVoucherDtos {

  private ExperienceVoucherDtos() {}

  public record AdminCreateVouchersRequest(
      List<String> codes, String remark, Integer type, LocalDateTime validUntil, String batchNo) {}

  public record AdminUpdateVoucherRequest(
      String remark, Integer status, LocalDateTime validUntil, String batchNo) {}

  public record AdminGenerateVouchersRequest(
      Integer count, Integer type, LocalDateTime validUntil, String batchNo) {}

  public record GeneratePdfRequest(List<String> codes) {}

  public record ValidateVoucherRequest(String code) {}

  public record ValidateVoucherResponse(String code, boolean valid, Integer type, Integer status) {}

  public record RedeemVoucherRequest(String code, List<String> codes, String bookingId) {}

  public record RedeemVoucherResponse(String code, String bookingId) {}

  public record AutoRedeemPointsResponse(
      String experienceCode, List<String> usedPointCodes, String message) {}
}
