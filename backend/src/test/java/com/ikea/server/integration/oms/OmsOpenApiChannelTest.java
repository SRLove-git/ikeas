package com.ikea.server.integration.oms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.ikea.server.integration.oms.OmsDtos.OpenOrderResponse;
import com.ikea.server.integration.oms.OmsDtos.OpenPaymentNotifyRequest;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OmsOpenApiChannelTest {

  @Test
  void paymentNotificationIncludesProviderTransactionAndPaidTimeForReconciliation() {
    OmsHttpClient client = mock(OmsHttpClient.class);
    OmsOpenApiChannel channel = new OmsOpenApiChannel(new OmsProperties(), client);

    channel.notifyPayment(
        "ORD-1001", "YP-9001", new BigDecimal("12.34"), "paynow", "D-ORDER-1001");

    ArgumentCaptor<Object> body = ArgumentCaptor.forClass(Object.class);
    verify(client).post(
        eq("/api/v1/open/orders/ORD-1001/payment-notify"),
        body.capture(),
        eq(OpenOrderResponse.class));
    OpenPaymentNotifyRequest request = (OpenPaymentNotifyRequest) body.getValue();
    assertEquals("YP-9001", request.paymentNo());
    assertEquals("YP-9001", request.channelTxnNo());
    assertEquals("D-ORDER-1001", request.providerOrderNo());
    assertEquals("paynow", request.channel());
    assertEquals(new BigDecimal("12.34"), request.amount());
    assertNotNull(request.paidAt());
  }
}
