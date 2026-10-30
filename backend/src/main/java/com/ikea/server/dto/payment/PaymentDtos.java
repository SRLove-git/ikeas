package com.ikea.server.dto.payment;

import java.util.List;

public final class PaymentDtos {

  private PaymentDtos() {}

  public record PaymentOptions(
      boolean mockOnly,
      String stripePublicKey,
      String provider,
      List<String> enabledMethods) {}

  public record CreatePaymentResponse(
      boolean mockOnly, String channel, String payUrl, boolean completed) {}

  public record PaymentStatusResponse(String status, boolean retryAllowed) {}
}
