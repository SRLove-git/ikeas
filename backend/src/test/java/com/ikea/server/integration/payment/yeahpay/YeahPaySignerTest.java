package com.ikea.server.integration.payment.yeahpay;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class YeahPaySignerTest {

  @Test
  void signShouldMatchSha512Base64Vector() {
    String signature =
        YeahPaySigner.sign(
            "/acceptance-open-api/cardOrder/getRedirectUrl",
            "app-test",
            "1700000000000",
            "1.0",
            "AbCdEf1234567890",
            "{\"merchantId\":\"merchant-test\"}",
            "test-api-key");

    assertEquals(
        "b4XshQeKfu5KedSqtc0SZrlprAj78jg/tjGpOFbd5j5l/U1Mb8eC4uQ40il6JDJuQYe8pId2Lb9BKxn5CU4Xyw==",
        signature);
    assertTrue(
        YeahPaySigner.verify(
            signature,
            "/acceptance-open-api/cardOrder/getRedirectUrl",
            "app-test",
            "1700000000000",
            "1.0",
            "AbCdEf1234567890",
            "{\"merchantId\":\"merchant-test\"}",
            "test-api-key"));
    assertFalse(
        YeahPaySigner.verify(
            signature,
            "/acceptance-open-api/cardOrder/getRedirectUrl",
            "app-test",
            "1700000000000",
            "1.0",
            "AbCdEf1234567890",
            "{}",
            "test-api-key"));
  }

  @Test
  void nonceShouldUseExpectedLengthAndAlphabet() {
    assertTrue(YeahPaySigner.nonce().matches("[A-Za-z0-9]{16}"));
  }
}
