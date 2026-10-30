package com.ikea.server.integration.payment.yeahpay;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class YeahPayClientTest {

  private final ObjectMapper mapper = new ObjectMapper();
  private HttpServer server;
  private YeahPayProperties properties;
  private volatile String receivedBody;
  private volatile String receivedTimestamp;
  private volatile String receivedNonce;
  private volatile String receivedSignature;
  private volatile String receivedMethod;
  private volatile String checkoutResponse;
  private volatile String queryResponse;
  private volatile int httpStatus;

  @BeforeEach
  void setUp() throws Exception {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    httpStatus = 200;
    checkoutResponse =
        "{\"code\":\"0\",\"data\":{\"url\":"
            + "\"https://payment.yeahpay.net/checkout/test-session\"}}";
    server.createContext(
        "/acceptance-open-api/cardOrder/getRedirectUrl",
        exchange -> respond(exchange, checkoutResponse));
    server.createContext(
        "/acceptance-open-api/cardOrder/getPcRedirectUrl",
        exchange -> respond(exchange,
              "{\"code\":\"0\",\"data\":{\"url\":"
                  + "\"https://payment.yeahpay.net/checkout/pc-test-session\"}}"));
    server.createContext(
        "/acceptance-open-api/order/queryOrder", exchange -> respond(exchange, queryResponse));
    server.start();

    String origin = "http://localhost:" + server.getAddress().getPort();
    properties = new YeahPayProperties();
    properties.setEnabled(true);
    properties.setAppId("app-test");
    properties.setApiKey("test-api-key");
    properties.setMerchantId("merchant-test");
    properties.setApiBaseUrl(origin + "/acceptance-open-api");
    properties.setSignatureDomain(origin);
    properties.setCallbackUrl("https://medical-sg.com/zh/profile/my-orders?payment=success");
    properties.setNotifyUrl("https://medical-sg.com/api/v1/payment/yeahpay/webhook");
  }

  private void respond(HttpExchange exchange, String json) throws IOException {
    receivedBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
    receivedMethod = exchange.getRequestMethod();
    receivedTimestamp = exchange.getRequestHeaders().getFirst("timestamp");
    receivedNonce = exchange.getRequestHeaders().getFirst("nonce");
    receivedSignature = exchange.getRequestHeaders().getFirst("signature");
    byte[] response = json.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", "application/json");
    exchange.sendResponseHeaders(httpStatus, response.length);
    try (var output = exchange.getResponseBody()) {
      output.write(response);
    }
  }

  @AfterEach
  void tearDown() {
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  void createHostedCheckoutShouldSendSignedRequestAndReturnAllowedHttpsUrl()
      throws Exception {
    YeahPayClient client = new YeahPayClient(properties, mapper);

    String checkoutUrl =
        client.createHostedCheckout("ORD-1001", "SGD", 1234, "BUZUD Order ORD-1001", "VISA");

    assertEquals("https://payment.yeahpay.net/checkout/test-session", checkoutUrl);
    JsonNode request = mapper.readTree(receivedBody);
    assertEquals("merchant-test", request.path("merchantId").asText());
    assertEquals("ORD-1001", request.path("orderId").asText());
    assertEquals("1234", request.path("amount").asText());
    assertEquals("VISA", request.path("payWay").asText());
    assertEquals(
        "https://medical-sg.com/api/v1/payment/yeahpay/webhook",
        request.path("notifyUrl").asText());
    assertTrue(request.path("callback").asText().endsWith("&orderNo=ORD-1001"));

    String expected =
        YeahPaySigner.sign(
            "/acceptance-open-api/cardOrder/getRedirectUrl",
            "app-test",
            receivedTimestamp,
            YeahPaySigner.VERSION,
            receivedNonce,
            receivedBody,
            "test-api-key");
    assertEquals(expected, receivedSignature);
  }

  @Test
  void createPcHostedCheckoutShouldUseDesktopEndpointAndSendRequiredCustomerDetails()
      throws Exception {
    YeahPayClient client = new YeahPayClient(properties, mapper);

    String checkoutUrl =
        client.createPcHostedCheckout(
            "ORD-PC-1001",
            "SGD",
            1234,
            "BUZUD Order ORD-PC-1001",
            "VISA",
            new YeahPayClient.PcCheckoutDetails(
                "42",
                "Jamie Tan",
                "jamie@example.com",
                "10 Anson Road, Singapore 079903",
                "079903"));

    assertEquals("https://payment.yeahpay.net/checkout/pc-test-session", checkoutUrl);
    JsonNode request = mapper.readTree(receivedBody);
    assertEquals("PHYSICAL", request.path("busiType").asText());
    assertEquals("079903", mapper.readTree(request.path("logisticsInfo").asText())
        .path("postal_code").asText());
    assertEquals("jamie@example.com", mapper.readTree(request.path("consumerInfo").asText())
        .path("email").asText());
    assertEquals("other", request.path("target").asText());

    String expected =
        YeahPaySigner.sign(
            "/acceptance-open-api/cardOrder/getPcRedirectUrl",
            "app-test",
            receivedTimestamp,
            YeahPaySigner.VERSION,
            receivedNonce,
            receivedBody,
            "test-api-key");
    assertEquals(expected, receivedSignature);
  }

  @Test
  void checkoutUrlShouldRequireHttpsAndAnExactYeahPayDomainBoundary() {
    assertThrows(
        IllegalStateException.class,
        () -> YeahPayClient.validateCheckoutUrl("http://payment.yeahpay.net/checkout/test"));
    assertThrows(
        IllegalStateException.class,
        () -> YeahPayClient.validateCheckoutUrl("https://yeahpay.net.attacker.example/test"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"0", "200", "\"0\"", "\"200\""})
  void checkoutShouldAcceptBothDocumentedSuccessCodes(String code) {
    checkoutResponse = "{\"code\":" + code
        + ",\"data\":{\"url\":\"https://payment.yeahpay.net/checkout/test-session\"}}";

    assertEquals("https://payment.yeahpay.net/checkout/test-session", createCheckout());
  }

  @Test
  void checkoutShouldRejectBusinessFailureEvenWhenItContainsAValidUrl() {
    checkoutResponse = """
        {"code":10001,"traceId":"trace-rejected","message":"secret-provider-detail",
         "data":{"url":"https://payment.yeahpay.net/checkout/test-session"}}
        """;

    var error = assertThrows(YeahPayClient.RejectedRequestException.class, this::createCheckout);

    assertTrue(error.getMessage().contains("code=10001"));
    assertTrue(error.getMessage().contains("traceId=trace-rejected"));
    assertFalse(error.getMessage().contains("secret-provider-detail"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"null", "true", "{}", "[]", "0.5", "\"success\"", "\"00\"", "\"0.0\""})
  void checkoutShouldRejectMalformedBusinessCodesWithoutClaimingAConfirmedRejection(String code) {
    checkoutResponse = "{\"code\":" + code
        + ",\"data\":{\"url\":\"https://payment.yeahpay.net/checkout/test-session\"}}";

    var error = assertThrows(IllegalStateException.class, this::createCheckout);

    assertFalse(error instanceof YeahPayClient.RejectedRequestException);
  }

  @Test
  void checkoutShouldRejectMissingBusinessCode() {
    checkoutResponse =
        "{\"data\":{\"url\":\"https://payment.yeahpay.net/checkout/test-session\"}}";

    var error = assertThrows(IllegalStateException.class, this::createCheckout);

    assertFalse(error instanceof YeahPayClient.RejectedRequestException);
  }

  @Test
  void successfulCodeWithoutCheckoutUrlShouldRemainAnUnknownOutcome() {
    checkoutResponse = "{\"code\":0,\"data\":{}}";

    var error = assertThrows(IllegalStateException.class, this::createCheckout);

    assertFalse(error instanceof YeahPayClient.RejectedRequestException);
  }

  @Test
  void serverErrorShouldRemainAnUnknownOutcomeEvenWithABusinessCodeInTheBody() {
    httpStatus = 503;
    checkoutResponse = "{\"code\":10001,\"message\":\"Service unavailable\","
        + "\"url\":\"https://payment.yeahpay.net/checkout?token=private-session\"}";

    var error = assertThrows(IllegalStateException.class, this::createCheckout);

    assertFalse(error instanceof YeahPayClient.RejectedRequestException);
    assertFalse(error.getMessage().contains("private-session"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"0", "200", "\"0\"", "\"200\""})
  void queryShouldSendMerchantOrderNumberAndParseSuccessfulTransaction(String code) throws Exception {
    queryResponse = "{\"code\":" + code + ",\"traceId\":\"trace-query\",\"data\":"
        + successfulTransaction("\"1234\"") + "}";

    var result = new YeahPayClient(properties, mapper).queryOrder("ORD-1001");

    assertTrue(result.found());
    assertEquals(2, result.status());
    assertEquals("merchant-test", result.merchantId());
    assertEquals("ORD-1001", result.thirdOrderId());
    assertEquals("YP-1001", result.transactionNo());
    assertEquals(1234L, result.amountMinor());
    assertEquals("SGD", result.currency());
    assertEquals("trace-query", result.traceId());
    JsonNode request = mapper.readTree(receivedBody);
    assertEquals("POST", receivedMethod);
    assertEquals(2, request.size());
    assertEquals("merchant-test", request.path("merchantId").asText());
    assertEquals("ORD-1001", request.path("thirdOrderId").asText());
    assertEquals(
        YeahPaySigner.sign("/acceptance-open-api/order/queryOrder", "app-test",
            receivedTimestamp, YeahPaySigner.VERSION, receivedNonce, receivedBody, "test-api-key"),
        receivedSignature);
  }

  @Test
  void missingChannelOrderShouldRemainUnknownRatherThanFailed() {
    queryResponse = "{\"code\":10012,\"traceId\":\"trace-not-found\",\"data\":null}";

    var result = new YeahPayClient(properties, mapper).queryOrder("ORD-1001");

    assertFalse(result.found());
    assertNull(result.status());
    assertNull(result.amountMinor());
    assertEquals("10012", result.code());
    assertEquals("trace-not-found", result.traceId());
  }

  @Test
  void queryShouldThrowOnAnApiFailureWithoutExposingProviderMessage() {
    queryResponse = """
        {"code":-100,"traceId":"trace-error","message":"secret-provider-detail","data":null}
        """;

    var error = assertThrows(YeahPayClient.RejectedRequestException.class,
        () -> new YeahPayClient(properties, mapper).queryOrder("ORD-1001"));

    assertTrue(error.getMessage().contains("code=-100"));
    assertTrue(error.getMessage().contains("traceId=trace-error"));
    assertFalse(error.getMessage().contains("secret-provider-detail"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"1234", "\"1234\"", "0", "9223372036854775807"})
  void queryShouldPreserveExactIntegerMinorAmounts(String amount) {
    queryResponse = "{\"code\":0,\"data\":" + successfulTransaction(amount) + "}";

    var result = new YeahPayClient(properties, mapper).queryOrder("ORD-1001");

    assertEquals(Long.parseLong(amount.replace("\"", "")), result.amountMinor());
  }

  @ParameterizedTest
  @ValueSource(strings = {"1234.5", "1234.0", "\"1234.5\"", "\"1234.0\"", "true", "{}",
      "-1", "\"-1\"", "9223372036854775808", "\"9223372036854775808\""})
  void queryShouldRejectFractionalNegativeAndOverflowAmounts(String amount) {
    queryResponse = "{\"code\":0,\"data\":" + successfulTransaction(amount) + "}";

    var error = assertThrows(IllegalStateException.class,
        () -> new YeahPayClient(properties, mapper).queryOrder("ORD-1001"));

    assertFalse(error instanceof YeahPayClient.RejectedRequestException);
  }

  @ParameterizedTest
  @ValueSource(strings = {"null", "[]", "{}", "{\"status\":true}", "{\"status\":2.5}",
      "{\"status\":\"2.0\"}", "{\"status\":2147483648}", "{\"status\":2}"})
  void queryShouldRejectMalformedOrIncompleteSuccessfulResponses(String data) {
    queryResponse = "{\"code\":0,\"data\":" + data + "}";

    var error = assertThrows(IllegalStateException.class,
        () -> new YeahPayClient(properties, mapper).queryOrder("ORD-1001"));

    assertFalse(error instanceof YeahPayClient.RejectedRequestException);
  }

  @Test
  void failedOrderMayOmitOptionalSettlementFields() {
    queryResponse = "{\"code\":0,\"data\":{\"status\":\"8\"}}";

    var result = new YeahPayClient(properties, mapper).queryOrder("ORD-1001");

    assertTrue(result.found());
    assertEquals(8, result.status());
    assertNull(result.transactionNo());
    assertNull(result.amountMinor());
  }

  @Test
  void queryShouldPreserveUnknownIntegerStatusesForTheServiceToHandle() {
    queryResponse = "{\"code\":0,\"data\":{\"status\":99}}";

    var result = new YeahPayClient(properties, mapper).queryOrder("ORD-1001");

    assertTrue(result.found());
    assertEquals(99, result.status());
  }

  @Test
  void queryShouldUseChannelTransactionNumberWhenYeahPayNumberIsAbsent() {
    queryResponse = "{\"code\":0,\"data\":"
        + successfulTransaction("1234").replace("leshuaOrderId", "channelOrderId") + "}";

    assertEquals("YP-1001", new YeahPayClient(properties, mapper).queryOrder("ORD-1001")
        .transactionNo());
  }

  @Test
  void queryShouldRejectWrongIdentityTypesAndDropUnsafeDiagnosticTrace() {
    queryResponse = """
        {"code":0,"traceId":"token=secret-provider-detail","data":
          {"status":2,"merchantId":123,"thirdOrderId":"ORD-1001",
           "leshuaOrderId":"YP-1001","amount":"1234","currency":"SGD"}}
        """;

    var error = assertThrows(IllegalStateException.class,
        () -> new YeahPayClient(properties, mapper).queryOrder("ORD-1001"));

    assertTrue(error.getMessage().contains("merchantId"));
    assertFalse(error.getMessage().contains("secret-provider-detail"));
  }

  private String createCheckout() {
    return new YeahPayClient(properties, mapper)
        .createHostedCheckout("ORD-1001", "SGD", 1234, "Test order", "VISA");
  }

  private static String successfulTransaction(String amount) {
    return "{\"status\":\"2\",\"merchantId\":\"merchant-test\",\"thirdOrderId\":\"ORD-1001\","
        + "\"leshuaOrderId\":\"YP-1001\",\"amount\":" + amount + ",\"currency\":\"SGD\"}";
  }
}
