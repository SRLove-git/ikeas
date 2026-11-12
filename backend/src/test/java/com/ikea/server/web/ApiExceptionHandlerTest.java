package com.ikea.server.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.ikea.server.integration.payment.yeahpay.YeahPayClient.RejectedRequestException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

class ApiExceptionHandlerTest {

  @Test
  void oversizedUploadShouldReturnPayloadTooLarge() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    when(request.getRequestURI()).thenReturn("/api/v1/admin/oss/upload");

    ResponseEntity<?> response =
        new ApiExceptionHandler()
            .handleUploadTooLarge(new MaxUploadSizeExceededException(20L * 1024 * 1024), request);

    assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
    assertTrue(String.valueOf(response.getBody()).contains("上传文件超过允许的大小"));
  }

  @Test
  void providerBusinessRejectionShouldReturnReadableGatewayError() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    when(request.getRequestURI()).thenReturn("/api/v1/payment/orders/ORDER-1");

    ResponseEntity<?> response =
        new ApiExceptionHandler()
            .handlePaymentProviderRejected(
                new RejectedRequestException("code=-5087 traceId=provider-trace"), request);

    assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
    String body = String.valueOf(response.getBody());
    assertTrue(body.contains("支付渠道暂不可用"));
    assertFalse(body.contains("-5087"));
    assertFalse(body.contains("provider-trace"));
  }
}
