package com.ikea.server.web;

import com.ikea.server.dto.marketing.MarketingDtos.EmailCouponClaimRequest;
import com.ikea.server.dto.marketing.MarketingDtos.EmailCouponClaimResponse;
import com.ikea.server.entity.Coupon;
import com.ikea.server.service.MarketingQrCodeService;
import com.ikea.server.service.MarketingService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 公开的扫码领券接口，无需登录。 */
@RestController
@RequestMapping("/api/v1/marketing")
public class CouponClaimController {

  private final MarketingService marketingService;
  private final MarketingQrCodeService qrCodeService;

  public CouponClaimController(
      MarketingService marketingService, MarketingQrCodeService qrCodeService) {
    this.marketingService = marketingService;
    this.qrCodeService = qrCodeService;
  }

  @PostMapping("/coupons/claim-by-email")
  public EmailCouponClaimResponse claimByEmail(@RequestBody EmailCouponClaimRequest request) {
    return marketingService.claimByEmail(request.email(), request.code());
  }

  @GetMapping(value = "/coupons/{id}/qr.png", produces = MediaType.IMAGE_PNG_VALUE)
  public ResponseEntity<byte[]> couponQr(@PathVariable Long id) {
    Coupon coupon = marketingService.couponById(id);
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_PNG)
        .body(qrCodeService.couponQr(coupon.getCode()));
  }
}
