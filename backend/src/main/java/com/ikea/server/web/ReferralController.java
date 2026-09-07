package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.referral.ReferralDtos.ReferralSummary;
import com.ikea.server.service.ReferralService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/referrals")
public class ReferralController {

  private final ReferralService referralService;

  public ReferralController(ReferralService referralService) {
    this.referralService = referralService;
  }

  @GetMapping("/summary")
  public ReferralSummary summary(HttpServletRequest request) {
    return referralService.summary(userId(request));
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    if (value == null) {
      throw new UnauthorizedException("请先登录");
    }
    return Long.valueOf(value);
  }
}
