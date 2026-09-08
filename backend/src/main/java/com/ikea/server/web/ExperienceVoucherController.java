package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherResponse;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherResponse;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.service.ExperienceVoucherService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/experience-vouchers")
public class ExperienceVoucherController {

  private final ExperienceVoucherService voucherService;

  public ExperienceVoucherController(ExperienceVoucherService voucherService) {
    this.voucherService = voucherService;
  }

  @PostMapping("/validate")
  public ValidateVoucherResponse validate(@RequestBody ValidateVoucherRequest request) {
    return voucherService.validate(request.code());
  }

  @GetMapping("/mine")
  public List<ExperienceVoucher> mine(HttpServletRequest request) {
    return voucherService.listUserVouchers(userId(request));
  }

  @PostMapping("/redeem")
  public RedeemVoucherResponse redeem(@RequestBody RedeemVoucherRequest request) {
    if (request.codes() != null && !request.codes().isEmpty()) {
      String bookingId = request.bookingId() == null ? "" : request.bookingId();
      String codes =
          voucherService.redeemPointVouchersForBooking(request.codes(), bookingId);
      return new RedeemVoucherResponse(codes, bookingId);
    }
    return voucherService.redeem(request.code(), request.bookingId());
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    return Long.valueOf(value);
  }
}
