package com.ikea.server.web;

import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.RedeemVoucherResponse;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherRequest;
import com.ikea.server.dto.experience.ExperienceVoucherDtos.ValidateVoucherResponse;
import com.ikea.server.service.ExperienceVoucherService;
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

  @PostMapping("/redeem")
  public RedeemVoucherResponse redeem(@RequestBody RedeemVoucherRequest request) {
    return voucherService.redeem(request.code(), request.bookingId());
  }
}
