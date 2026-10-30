package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.payment.PaymentDtos.CreatePaymentResponse;
import com.ikea.server.entity.AppUser;
import com.ikea.server.entity.Order;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient.PcCheckoutDetails;
import com.ikea.server.integration.payment.yeahpay.YeahPayProperties;
import com.ikea.server.integration.payment.yeahpay.YeahPaySigner;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.web.UnauthorizedException;
import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

class PaymentGatewayServiceTest {

  private OrderMapper orderMapper;
  private OrderService orderService;
  private YeahPayClient yeahPayClient;
  private YeahPayProperties properties;
  private PaymentPersistenceService paymentPersistenceService;
  private UserService userService;
  private PaymentGatewayService service;

  @BeforeEach
  void setUp() {
    orderMapper = mock(OrderMapper.class);
    orderService = mock(OrderService.class);
    yeahPayClient = mock(YeahPayClient.class);
    properties = configuredProperties();
    paymentPersistenceService = mock(PaymentPersistenceService.class);
    userService = mock(UserService.class);
    service =
        new PaymentGatewayService(
            orderMapper,
            orderService,
            yeahPayClient,
            properties,
            paymentPersistenceService,
            userService);
    when(paymentPersistenceService.recordCallbackIfAbsent(any(), any(), any(), any()))
        .thenReturn(true);
    when(paymentPersistenceService.reservePaymentAttempt(any(), any(), any())).thenReturn(true);
  }

  @Test
  void createPaymentShouldScopeOrderLookupToAuthenticatedOwner() {
    Order order = new Order();
    order.setOrderNo("ORD-1001");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(yeahPayClient.isConfigured()).thenReturn(true);
    when(yeahPayClient.createHostedCheckout(any(), any(), eq(1234L), any(), any()))
        .thenReturn("https://payment.yeahpay.net/checkout/test-session");

    CreatePaymentResponse result = service.createPayment(42L, "ORD-1001", "card");

    assertEquals("yeahpay", result.channel());
    verify(orderMapper).selectOne(any(Wrapper.class));
  }

  @ParameterizedTest
  @CsvSource({
    "visa,VISA",
    "mastercard,MASTER",
    "amex,AMEX",
    "unionpay,UnionPay",
    "applepay,ApplePay",
    "googlepay,GooglePay"
  })
  void createPaymentShouldMapWalletAndCardChannelsToYeahPayCodes(
      String channel, String yeahPayCode) {
    Order order = new Order();
    order.setOrderNo("ORD-1002");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(yeahPayClient.isConfigured()).thenReturn(true);
    when(yeahPayClient.createHostedCheckout(any(), any(), eq(1234L), any(), eq(yeahPayCode)))
        .thenReturn("https://payment.yeahpay.net/checkout/method-session");

    CreatePaymentResponse result = service.createPayment(42L, "ORD-1002", channel);

    assertEquals("yeahpay", result.channel());
    verify(yeahPayClient)
        .createHostedCheckout("ORD-1002", "SGD", 1234L, "BUZUD Order ORD-1002", yeahPayCode);
  }

  @ParameterizedTest
  @ValueSource(strings = {"visa", "mastercard", "amex"})
  @SuppressWarnings("unchecked")
  void stripeOnlyConfigurationShouldAcceptEveryAdvertisedCardMethod(String channel)
      throws Exception {
    HttpClient stripeHttpClient = configureStripeOnly();
    HttpResponse<String> response = mock(HttpResponse.class);
    when(response.statusCode()).thenReturn(200);
    when(response.body()).thenReturn("{\"url\":\"https://checkout.stripe.com/c/test-session\"}");
    when(stripeHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
        .thenReturn(response);

    assertEquals("stripe", service.options().provider());
    assertTrue(service.options().enabledMethods().contains(channel));
    CreatePaymentResponse result = service.createPayment(42L, "ORD-STRIPE-CARD", channel);

    assertEquals("stripe", result.channel());
    assertEquals("https://checkout.stripe.com/c/test-session", result.payUrl());
    verify(paymentPersistenceService)
        .reservePaymentAttempt("ORD-STRIPE-CARD", "stripe", channel);
    ArgumentCaptor<HttpRequest> request = ArgumentCaptor.forClass(HttpRequest.class);
    verify(stripeHttpClient).send(request.capture(), any(HttpResponse.BodyHandler.class));
    assertEquals(
        "checkout-ORD-STRIPE-CARD",
        request.getValue().headers().firstValue("Idempotency-Key").orElseThrow());
    verify(yeahPayClient, never()).createHostedCheckout(any(), any(), anyLong(), any(), any());
  }

  @ParameterizedTest
  @ValueSource(strings = {"yeahpay", "unionpay", "applepay", "googlepay"})
  void stripeOnlyConfigurationShouldNotSilentlyFallbackForUnsupportedMethods(String channel) {
    HttpClient stripeHttpClient = configureStripeOnly();

    assertThrows(
        UnauthorizedException.class,
        () -> service.createPayment(42L, "ORD-STRIPE-CARD", channel));

    verify(paymentPersistenceService, never()).reservePaymentAttempt(any(), any(), any());
    verifyNoInteractions(stripeHttpClient);
  }

  private HttpClient configureStripeOnly() {
    Order order = new Order();
    order.setOrderNo("ORD-STRIPE-CARD");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(yeahPayClient.isConfigured()).thenReturn(false);
    ReflectionTestUtils.setField(service, "stripeSecretKey", "sk_test");
    ReflectionTestUtils.setField(service, "stripeWebhookSecret", "whsec_test");
    ReflectionTestUtils.setField(service, "stripeApiBaseUrl", "https://api.stripe.com");
    HttpClient stripeHttpClient = mock(HttpClient.class);
    ReflectionTestUtils.setField(service, "httpClient", stripeHttpClient);
    return stripeHttpClient;
  }

  @Test
  void createPaymentShouldUsePcCheckoutWithConsumerAndDeliveryDetails() {
    properties.setPcCheckoutEnabled(true);
    Order order = new Order();
    order.setOrderNo("ORD-PC-1001");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    order.setCustomer("Jamie Tan");
    order.setAddress("10 Anson Road, Singapore 079903");

    AppUser user = new AppUser();
    user.setId(42L);
    user.setEmail("jamie@example.com");
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(userService.findById(42L)).thenReturn(Optional.of(user));
    when(yeahPayClient.isConfigured()).thenReturn(true);
    when(yeahPayClient.createPcHostedCheckout(any(), any(), eq(1234L), any(), any(), any()))
        .thenReturn("https://payment.yeahpay.net/checkout/pc-session");

    CreatePaymentResponse result =
        service.createPayment(42L, "ORD-PC-1001", "visa", "pc");

    assertEquals("yeahpay", result.channel());
    verify(yeahPayClient)
        .createPcHostedCheckout(
            "ORD-PC-1001",
            "SGD",
            1234L,
            "BUZUD Order ORD-PC-1001",
            "VISA",
            new PcCheckoutDetails(
                "42",
                "Jamie Tan",
                "jamie@example.com",
                "10 Anson Road, Singapore 079903",
                "079903"));
    verify(yeahPayClient, never()).createHostedCheckout(any(), any(), anyLong(), any(), any());
  }

  @ParameterizedTest
  @CsvSource({
    "visa,VISA",
    "mastercard,MASTER",
    "amex,AMEX",
    "applepay,ApplePay",
    "googlepay,GooglePay"
  })
  void createPaymentShouldRouteCachedPcRequestsToH5ByDefaultWithoutConsumerLookup(
      String channel, String yeahPayCode) {
    Order order = new Order();
    order.setOrderNo("ORD-H5-1001");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    // Deliberately omit PC-only consumer details to cover existing orders and cached clients.
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(yeahPayClient.isConfigured()).thenReturn(true);
    when(yeahPayClient.createHostedCheckout(any(), any(), eq(1234L), any(), eq(yeahPayCode)))
        .thenReturn("https://payment.yeahpay.net/checkout/h5/#/checkstand?token=test");

    CreatePaymentResponse result = service.createPayment(42L, "ORD-H5-1001", channel, "pc");

    assertEquals("yeahpay", result.channel());
    assertEquals("https://payment.yeahpay.net/checkout/h5/#/checkstand?token=test", result.payUrl());
    verify(yeahPayClient)
        .createHostedCheckout("ORD-H5-1001", "SGD", 1234L, "BUZUD Order ORD-H5-1001", yeahPayCode);
    verify(yeahPayClient, never())
        .createPcHostedCheckout(any(), any(), anyLong(), any(), any(), any());
    verifyNoInteractions(userService);
  }

  @Test
  void createPaymentShouldRejectMissingAuthenticatedOwner() {
    assertThrows(
        RuntimeException.class,
        () -> service.createPayment(null, "ORD-1001", "card"));
  }

  @Test
  void createPaymentShouldRejectOrderReturnedForAnotherOwner() {
    Order order = new Order();
    order.setOrderNo("ORD-1001");
    order.setUserId(99L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);

    assertThrows(
        RuntimeException.class,
        () -> service.createPayment(42L, "ORD-1001", "card"));
  }

  @Test
  void zeroAmountOrderShouldCompleteWithoutOpeningAProviderCheckout() {
    Order order = new Order();
    order.setOrderNo("ORD-ZERO");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(BigDecimal.ZERO);
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);

    CreatePaymentResponse result = service.createPayment(42L, "ORD-ZERO", "visa");

    assertEquals(true, result.completed());
    assertEquals("internal", result.channel());
    verify(orderService)
        .markPaidByGateway("ORD-ZERO", "internal", "ZERO-ORD-ZERO", BigDecimal.ZERO, "SGD");
    verifyNoInteractions(yeahPayClient);
  }

  @Test
  void activePaymentAttemptShouldBlockASecondHostedCheckout() {
    Order order = new Order();
    order.setOrderNo("ORD-DUPLICATE");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(yeahPayClient.isConfigured()).thenReturn(true);
    when(paymentPersistenceService.reservePaymentAttempt(
            "ORD-DUPLICATE", "yeahpay", "visa"))
        .thenReturn(false);

    assertThrows(
        IllegalArgumentException.class,
        () -> service.createPayment(42L, "ORD-DUPLICATE", "visa"));
    verify(yeahPayClient, never()).createHostedCheckout(any(), any(), anyLong(), any(), any());
  }

  @Test
  void paymentMethodNotEnabledForMerchantShouldBeRejectedServerSide() {
    properties.setEnabledMethods("visa");
    Order order = new Order();
    order.setOrderNo("ORD-METHOD");
    order.setUserId(42L);
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(yeahPayClient.isConfigured()).thenReturn(true);

    assertThrows(
        IllegalArgumentException.class,
        () -> service.createPayment(42L, "ORD-METHOD", "googlepay"));
    verify(paymentPersistenceService, never()).reservePaymentAttempt(any(), any(), any());
    verify(yeahPayClient, never()).createHostedCheckout(any(), any(), anyLong(), any(), any());
  }

  @Test
  void webhookShouldVerifySignatureAndMarkMatchingSuccessfulOrderPaid() {
    String timestamp = String.valueOf(System.currentTimeMillis());
    String nonce = "AbCdEf1234567890";
    String payload =
        "{\"merchantId\":\"merchant-test\",\"status\":2,"
            + "\"thirdOrderId\":\"ORD-1001\",\"leshuaOrderId\":\"YP-9001\","
            + "\"currency\":\"SGD\",\"amount\":1234}";
    String signature =
        YeahPaySigner.sign(
            properties.getNotifyUrl(),
            properties.getAppId(),
            timestamp,
            YeahPaySigner.VERSION,
            nonce,
            payload,
            properties.getApiKey());

    String result =
        service.handleYeahPayWebhook(
            payload,
            YeahPaySigner.VERSION,
            timestamp,
            YeahPaySigner.ALGORITHM,
            signature,
            properties.getAppId(),
            nonce);

    assertEquals("success", result);
    verify(paymentPersistenceService)
        .recordSuccessfulTransaction("yeahpay", "ORD-1001", "YP-9001", 1234L, "SGD");
    verify(orderService)
        .markPaidByGateway(
            "ORD-1001", "yeahpay", "YP-9001", new BigDecimal("12.34"), "SGD");
  }

  @Test
  void duplicateWebhookShouldReturnSuccessWithoutApplyingPaymentAgain() {
    String timestamp = String.valueOf(System.currentTimeMillis());
    String nonce = "AbCdEf1234567890";
    String payload =
        "{\"merchantId\":\"merchant-test\",\"status\":2,"
            + "\"thirdOrderId\":\"ORD-1001\",\"leshuaOrderId\":\"YP-9001\","
            + "\"currency\":\"SGD\",\"amount\":1234}";
    String signature =
        YeahPaySigner.sign(
            properties.getNotifyUrl(),
            properties.getAppId(),
            timestamp,
            YeahPaySigner.VERSION,
            nonce,
            payload,
            properties.getApiKey());
    when(paymentPersistenceService.recordCallbackIfAbsent(
            "yeahpay", timestamp + "\n" + nonce, "ORD-1001", "YP-9001"))
        .thenReturn(false);

    String result =
        service.handleYeahPayWebhook(
            payload,
            YeahPaySigner.VERSION,
            timestamp,
            YeahPaySigner.ALGORITHM,
            signature,
            properties.getAppId(),
            nonce);

    assertEquals("success", result);
    verify(paymentPersistenceService, never())
        .recordSuccessfulTransaction(any(), any(), any(), anyLong(), any());
    verify(orderService, never())
        .markPaidByGateway(any(), any(), any(), any(), any());
  }

  @Test
  void stripePaidWebhookShouldPersistAndApplyPaymentExactlyOnce() throws Exception {
    String secret = "whsec-test";
    ReflectionTestUtils.setField(service, "stripeSecretKey", "sk_test");
    ReflectionTestUtils.setField(service, "stripeWebhookSecret", secret);
    String payload =
        "{\"id\":\"evt_1001\",\"type\":\"checkout.session.completed\","
            + "\"data\":{\"object\":{\"client_reference_id\":\"ORD-STRIPE\","
            + "\"payment_intent\":\"pi_1001\",\"payment_status\":\"paid\","
            + "\"currency\":\"sgd\",\"amount_total\":1234}}}";
    long timestamp = Instant.now().getEpochSecond();
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    String signature =
        HexFormat.of()
            .formatHex(mac.doFinal((timestamp + "." + payload).getBytes(StandardCharsets.UTF_8)));

    String result = service.handleStripeWebhook(payload, "t=" + timestamp + ",v1=" + signature);

    assertEquals("ok", result);
    verify(paymentPersistenceService)
        .recordCallbackIfAbsent("stripe", "evt_1001", "ORD-STRIPE", "pi_1001");
    verify(paymentPersistenceService)
        .recordSuccessfulTransaction("stripe", "ORD-STRIPE", "pi_1001", 1234L, "sgd");
    verify(paymentPersistenceService).markPaymentAttemptSucceeded("ORD-STRIPE", "stripe");
    verify(orderService)
        .markPaidByGateway(
            "ORD-STRIPE", "stripe", "pi_1001", new BigDecimal("12.34"), "sgd");
  }

  @Test
  void webhookShouldRejectWrongMerchantEvenWithValidSignature() {
    String timestamp = String.valueOf(System.currentTimeMillis());
    String nonce = "AbCdEf1234567890";
    String payload =
        "{\"merchantId\":\"other-merchant\",\"status\":2,"
            + "\"thirdOrderId\":\"ORD-1001\",\"leshuaOrderId\":\"YP-9001\","
            + "\"currency\":\"SGD\",\"amount\":1234}";
    String signature =
        YeahPaySigner.sign(
            properties.getNotifyUrl(),
            properties.getAppId(),
            timestamp,
            YeahPaySigner.VERSION,
            nonce,
            payload,
            properties.getApiKey());

    assertThrows(
        IllegalArgumentException.class,
        () ->
            service.handleYeahPayWebhook(
                payload,
                YeahPaySigner.VERSION,
                timestamp,
                YeahPaySigner.ALGORITHM,
                signature,
                properties.getAppId(),
                nonce));
  }

  private static YeahPayProperties configuredProperties() {
    YeahPayProperties result = new YeahPayProperties();
    result.setEnabled(true);
    result.setAppId("app-test");
    result.setApiKey("test-api-key");
    result.setMerchantId("merchant-test");
    result.setEnabledMethods("visa,mastercard,amex,unionpay,applepay,googlepay");
    result.setCallbackUrl("https://medical-sg.com/zh/profile/my-orders?payment=success");
    result.setNotifyUrl("https://medical-sg.com/api/v1/payment/yeahpay/webhook");
    return result;
  }
}
