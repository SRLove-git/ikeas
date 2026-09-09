package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.dto.booking.BookingDtos.StaffRedeemRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.service.AdminSettingsService;
import com.ikea.server.service.BookingService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 门店工作人员独立核销入口，不登录完整管理后台。 */
@RestController
@RequestMapping("/api/v1/staff")
public class StaffRedeemController {

  private final BookingService bookingService;
  private final AdminSettingsService adminSettingsService;
  private final ObjectMapper mapper;

  public StaffRedeemController(
      BookingService bookingService,
      AdminSettingsService adminSettingsService,
      ObjectMapper mapper) {
    this.bookingService = bookingService;
    this.adminSettingsService = adminSettingsService;
    this.mapper = mapper;
  }

  @PostMapping("/redeem")
  public Booking redeem(@RequestBody StaffRedeemRequest request) {
    return bookingService.redeemByCode(request.code());
  }

  @GetMapping("/bookings")
  public List<Booking> bookings() {
    return bookingService.listBookings(null, null);
  }

  @GetMapping("/claim-secret")
  public Map<String, String> claimSecret() {
    JsonNode settings = adminSettingsService.get();
    JsonNode secret = settings == null ? null : settings.get("voucherClaimSecret");
    return Map.of("secret", secret == null || secret.isNull() ? "" : secret.asText(""));
  }

  @PostMapping("/claim-secret")
  public Map<String, String> updateClaimSecret(@RequestBody Map<String, String> body) {
    String secret = body == null || body.get("secret") == null ? "" : body.get("secret").trim();
    if (secret.isEmpty()) {
      throw new IllegalArgumentException("密钥不能为空");
    }
    JsonNode current = adminSettingsService.get();
    ObjectNode node = current == null || current.isNull() ? mapper.createObjectNode() : current.deepCopy();
    node.put("voucherClaimSecret", secret);
    adminSettingsService.update(node);
    return Map.of("secret", secret);
  }
}
