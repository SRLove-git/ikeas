package com.ikea.server.web;

import com.ikea.server.dto.marketing.MarketingDtos.AdminAdjustRequest;
import com.ikea.server.dto.marketing.MarketingDtos.AdminCouponRequest;
import com.ikea.server.entity.Coupon;
import com.ikea.server.entity.MemberAccount;
import com.ikea.server.service.MarketingService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/marketing")
public class AdminMarketingController {

  private final MarketingService marketingService;

  public AdminMarketingController(MarketingService marketingService) {
    this.marketingService = marketingService;
  }

  @GetMapping("/coupons")
  public List<Coupon> coupons() {
    return marketingService.listCoupons();
  }

  @PostMapping("/coupons")
  public Coupon createCoupon(@RequestBody AdminCouponRequest request) {
    return marketingService.createCoupon(request);
  }

  @PatchMapping("/coupons/{id}/status")
  public Map<String, Boolean> updateCouponStatus(
      @PathVariable Long id, @RequestBody Map<String, Integer> body) {
    marketingService.updateCouponStatus(id, body.get("status"));
    return Map.of("ok", true);
  }

  @PostMapping("/accounts/{userId}/adjust")
  public MemberAccount adjust(
      @PathVariable Long userId, @RequestBody AdminAdjustRequest request) {
    return marketingService.adjustAccount(userId, request.points(), request.balance());
  }
}
