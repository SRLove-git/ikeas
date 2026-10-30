package com.ikea.server.integration.payment.yeahpay;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class YeahPayClientTest {

  private final ObjectMapper mapper = new ObjectMapper();
  private HttpServer server;
  private YeahPayProperties properties;
  private volatile String receivedBody;
  private volatile String receivedTimestamp;
  private volatile String receivedNonce;
  private volatile String receivedSignature;

  @BeforeEach
  void setUp() throws Exception {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    server.createContext(
        "/acceptance-open-api/cardOrder/getRedirectUrl",
        exchange -> {
          receivedBody =
              new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
          receivedTimestamp = exchange.getRequestHeaders().getFirst("timestamp");
          receivedNonce = exchange.getRequestHeaders().getFirst("nonce");
          receivedSignature = exchange.getRequestHeaders().getFirst("signature");
          String json =
              "{\"code\":\"0\",\"data\":{\"url\":"
                  + "\"https://payment.yeahpay.net/checkout/test-session\"}}";
          byte[] response = json.getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().set("Content-Type", "application/json");
          exchange.sendResponseHeaders(200, response.length);
          try (var output = exchange.getResponseBody()) {
            output.write(response);
          }
        });
    server.createContext(
        "/acceptance-open-api/cardOrder/getPcRedirectUrl",
        exchange -> {
          receivedBody =
              new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
          receivedTimestamp = exchange.getRequestHeaders().getFirst("timestamp");
          receivedNonce = exchange.getRequestHeaders().getFirst("nonce");
          receivedSignature = exchange.getRequestHeaders().getFirst("signature");
          String json =
              "{\"code\":\"0\",\"data\":{\"url\":"
                  + "\"https://payment.yeahpay.net/checkout/pc-test-session\"}}";
          byte[] response = json.getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().set("Content-Type", "application/json");
          exchange.sendResponseHeaders(200, response.length);
          try (var output = exchange.getResponseBody()) {
            output.write(response);
          }
        });
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
}
