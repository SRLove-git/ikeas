package com.ikea.server.dto.experience;

import java.util.List;

public final class ExperienceVoucherDtos {

  private ExperienceVoucherDtos() {}

  public record AdminCreateVouchersRequest(List<String> codes, String remark) {}

  public record AdminUpdateVoucherRequest(String remark, Integer status) {}

  public record ValidateVoucherRequest(String code) {}

  public record ValidateVoucherResponse(String code, boolean valid) {}

  public record RedeemVoucherRequest(String code, String bookingId) {}

  public record RedeemVoucherResponse(String code, String bookingId) {}
}
