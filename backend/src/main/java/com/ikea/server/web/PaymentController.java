package com.ikea.server.web;

import com.ikea.server.dto.payment.PaymentDtos.CreatePaymentResponse;
import com.ikea.server.dto.payment.PaymentDtos.PaymentOptions;
import com.ikea.server.service.PaymentGatewayService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
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
      HttpServletRequest request) {
    return paymentGatewayService.createPayment(orderNo, channel);
  }

  @PostMapping("/stripe/webhook")
  public Map<String, String> stripeWebhook(
      @RequestBody String payload,
      @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
    String result = paymentGatewayService.handleStripeWebhook(payload, signature);
    return Map.of("received", "true", "result", result);
  }
}
