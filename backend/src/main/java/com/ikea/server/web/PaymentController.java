package com.ikea.server.web;

import com.ikea.server.constant.SecurityConstants;
import com.ikea.server.dto.payment.PaymentDtos.CreatePaymentResponse;
import com.ikea.server.dto.payment.PaymentDtos.PaymentOptions;
import com.ikea.server.service.PaymentGatewayService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payment")
public class PaymentController {

  private final PaymentGatewayService paymentGatewayService;

  public PaymentController(PaymentGatewayService paymentGatewayService) {
    this.paymentGatewayService = paymentGatewayService;
  }

  @GetMapping("/options")
  public PaymentOptions options() {
    return paymentGatewayService.options();
  }

  @PostMapping("/orders/{orderNo}")
  public CreatePaymentResponse create(
      @PathVariable String orderNo,
      @RequestParam(defaultValue = "card") String channel,
      @RequestParam(defaultValue = "h5") String checkout,
      HttpServletRequest request) {
    return paymentGatewayService.createPayment(userId(request), orderNo, channel, checkout);
  }

  @PostMapping("/stripe/webhook")
  public Map<String, String> stripeWebhook(
      @RequestBody String payload,
      @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
    String result = paymentGatewayService.handleStripeWebhook(payload, signature);
    return Map.of("received", "true", "result", result);
  }

  @PostMapping(value = "/yeahpay/webhook", produces = MediaType.TEXT_PLAIN_VALUE)
  public String yeahPayWebhook(
      @RequestBody String payload,
      @RequestHeader(value = "version", required = false) String version,
      @RequestHeader(value = "timestamp", required = false) String timestamp,
      @RequestHeader(value = "algorithm", required = false) String algorithm,
      @RequestHeader(value = "signature", required = false) String signature,
      @RequestHeader(value = "appId", required = false) String appId,
      @RequestHeader(value = "nonce", required = false) String nonce) {
    return paymentGatewayService.handleYeahPayWebhook(
        payload, version, timestamp, algorithm, signature, appId, nonce);
  }

  private static Long userId(HttpServletRequest request) {
    String value = (String) request.getAttribute(SecurityConstants.USER_ID_ATTRIBUTE);
    try {
      if (value == null) {
        throw new UnauthorizedException("请先登录");
      }
      return Long.valueOf(value);
    } catch (NumberFormatException ex) {
      throw new UnauthorizedException("登录信息无效");
    }
  }
}
