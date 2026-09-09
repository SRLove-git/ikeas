package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.ikea.server.dto.booking.BookingDtos.StaffRedeemRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.service.AdminSettingsService;
import com.ikea.server.service.BookingService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 门店工作人员独立核销入口：凭后台配置的核销密钥，不登录完整管理后台。 */
@RestController
@RequestMapping("/api/v1/staff")
public class StaffRedeemController {

  private final BookingService bookingService;
  private final AdminSettingsService adminSettingsService;

  public StaffRedeemController(
      BookingService bookingService, AdminSettingsService adminSettingsService) {
    this.bookingService = bookingService;
    this.adminSettingsService = adminSettingsService;
  }

  @PostMapping("/redeem")
  public Booking redeem(@RequestBody StaffRedeemRequest request) {
    String configuredSecret = currentRedeemSecret();
    if (configuredSecret == null || configuredSecret.isBlank()) {
      throw new IllegalArgumentException("核销密钥尚未配置");
    }
    String secret = request == null || request.secret() == null ? "" : request.secret().trim();
    if (secret.isEmpty() || !configuredSecret.equals(secret)) {
      throw new IllegalArgumentException("核销密钥不正确");
    }
    return bookingService.redeemByCode(request.code());
  }

  private String currentRedeemSecret() {
    JsonNode settings = adminSettingsService.get();
    if (settings == null) {
      return "";
    }
    JsonNode secret = settings.get("redeemSecret");
    return secret == null || secret.isNull() ? "" : secret.asText("");
  }
}
