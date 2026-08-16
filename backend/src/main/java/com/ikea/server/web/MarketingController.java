package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.marketing.MarketingDtos.AccountResponse;
import com.ikea.server.dto.marketing.MarketingDtos.ClaimRequest;
import com.ikea.server.dto.marketing.MarketingDtos.ClaimResponse;
import com.ikea.server.service.MarketingService;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/marketing")
public class MarketingController {

  private final MarketingService marketingService;

  public MarketingController(MarketingService marketingService) {
    this.marketingService = marketingService;
  }

  @GetMapping("/account")
  public AccountResponse account(HttpServletRequest request) {
    return marketingService.account(userId(request), BigDecimal.ZERO);
  }

  @GetMapping("/coupons")
  public java.util.List<com.ikea.server.dto.marketing.MarketingDtos.CouponView> coupons(
      HttpServletRequest request, @RequestParam(defaultValue = "0") BigDecimal subtotal) {
    return marketingService.account(userId(request), subtotal).coupons();
  }

  @PostMapping("/coupons/claim")
  public ClaimResponse claim(HttpServletRequest request, @RequestBody ClaimRequest body) {
    return marketingService.claim(userId(request), body.code());
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    return Long.valueOf(value);
  }
}
