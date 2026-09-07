package com.ikea.server.dto.payment;

public final class PaymentDtos {

  private PaymentDtos() {}

  public record PaymentOptions(boolean mockOnly, String stripePublicKey) {}

  public record CreatePaymentResponse(
      boolean mockOnly, String channel, String payUrl) {}
}
