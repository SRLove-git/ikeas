package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

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
    when(paymentPersistenceService.recordCallbackIfAbsent(any(), any(), any(), any(), any()))
        .thenReturn(true);
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
            "yeahpay", timestamp, nonce, "ORD-1001", "YP-9001"))
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
    result.setCallbackUrl("https://medical-sg.com/zh/profile/my-orders?payment=success");
    result.setNotifyUrl("https://medical-sg.com/api/v1/payment/yeahpay/webhook");
    return result;
  }
}
