package com.ikea.server.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ikea.server.dto.booking.BookingDtos.StaffRedeemRequest;
import com.ikea.server.entity.Booking;
import com.ikea.server.entity.ExperienceVoucher;
import com.ikea.server.service.AdminSettingsService;
import com.ikea.server.service.BookingService;
import com.ikea.server.service.ExperienceVoucherService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 门店工作人员独立核销入口，不登录完整管理后台。 */
@RestController
@RequestMapping("/api/v1/staff")
public class StaffRedeemController {

  private static final String DEFAULT_ACCESS_PASSWORD = "chungyip123#";

  private final BookingService bookingService;
  private final AdminSettingsService adminSettingsService;
  private final ObjectMapper mapper;
  private final ExperienceVoucherService experienceVoucherService;

  public StaffRedeemController(
      BookingService bookingService,
      AdminSettingsService adminSettingsService,
      ObjectMapper mapper,
      ExperienceVoucherService experienceVoucherService) {
    this.bookingService = bookingService;
    this.adminSettingsService = adminSettingsService;
    this.mapper = mapper;
    this.experienceVoucherService = experienceVoucherService;
  }

  @PostMapping("/redeem")
  public Booking redeem(@RequestBody StaffRedeemRequest request) {
    return bookingService.redeemByCode(request.code());
  }

  /** 访问密钥刷新页面前先验证访问密码（密码保存在网站设置 staffAccessPassword 中）。 */
  @PostMapping("/verify-access")
  public Map<String, Boolean> verifyAccess(@RequestBody Map<String, String> body) {
    String password = body == null ? "" : String.valueOf(body.getOrDefault("password", ""));
    String expected = currentAccessPassword();
    if (expected.isBlank() || !constantTimeEquals(expected, password)) {
      throw new IllegalArgumentException("访问密码不正确");
    }
    return Map.of("ok", true);
  }

  @GetMapping("/bookings")
  public List<Booking> bookings() {
    return bookingService.listBookings(null, null);
  }

  /** 门店工作人员查看实体券码列表。 */
  @GetMapping("/vouchers")
  public List<ExperienceVoucher> vouchers() {
    return experienceVoucherService.listVouchers(null, null, null);
  }

  @GetMapping("/claim-secret")
  public Map<String, String> claimSecret() {
    JsonNode settings = adminSettingsService.get();
    JsonNode secret = settings == null ? null : settings.get("voucherClaimSecret");
    return Map.of("secret", secret == null || secret.isNull() ? "" : secret.asText(""));
  }

  @GetMapping("/claim-code")
  public Map<String, Object> claimCode() {
    return Map.of(
        "code", experienceVoucherService.currentClaimCode(),
        "remainingSeconds", experienceVoucherService.claimCodeRemainingSeconds(),
        "totalSeconds", 30);
  }

  @GetMapping("/claim-quota")
  public Map<String, Integer> claimQuota() {
    return experienceVoucherService.claimQuota();
  }

  /** 门店工作人员在核销页查看/设置每个预约日期的名额。 */
  @GetMapping("/booking-daily-limit")
  public Map<String, Object> bookingDailyLimit() {
    return bookingService.dailyLimitConfig();
  }

  @PutMapping("/booking-daily-limit")
  public Map<String, Object> updateBookingDailyLimit(@RequestBody Map<String, Integer> body) {
    Integer limit = body == null ? null : body.get("limit");
    if (limit == null) {
      throw new IllegalArgumentException("名额不能为空");
    }
    bookingService.updateDailyBookingLimit(limit);
    return bookingService.dailyLimitConfig();
  }

  @PutMapping("/booking-daily-limit/{date}")
  public Map<String, Object> updateBookingDailyLimitForDate(
      @PathVariable String date, @RequestBody Map<String, Integer> body) {
    Integer limit = body == null ? null : body.get("limit");
    if (limit == null) {
      throw new IllegalArgumentException("名额不能为空");
    }
    bookingService.updateDailyBookingLimitForDate(LocalDate.parse(date), limit);
    return bookingService.dailyLimitConfig();
  }

  @DeleteMapping("/booking-daily-limit/{date}")
  public Map<String, Object> deleteBookingDailyLimitForDate(@PathVariable String date) {
    bookingService.deleteDailyBookingLimitForDate(LocalDate.parse(date));
    return bookingService.dailyLimitConfig();
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

  private String currentAccessPassword() {
    JsonNode settings = adminSettingsService.get();
    JsonNode value = settings == null ? null : settings.get("staffAccessPassword");
    if (value == null || value.isNull() || value.asText("").isBlank()) {
      return DEFAULT_ACCESS_PASSWORD;
    }
    return value.asText("");
  }

  private boolean constantTimeEquals(String a, String b) {
    byte[] left = a.getBytes(StandardCharsets.UTF_8);
    byte[] right = b.getBytes(StandardCharsets.UTF_8);
    int result = left.length ^ right.length;
    for (int i = 0; i < left.length && i < right.length; i++) {
      result |= left[i] ^ right[i];
    }
    return result == 0;
  }
}
