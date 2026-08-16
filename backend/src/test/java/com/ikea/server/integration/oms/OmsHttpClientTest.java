package com.ikea.server.integration.oms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ikea.server.integration.oms.OmsDtos.OmsResult;
import com.ikea.server.integration.oms.OmsDtos.OpenProductPage;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** OMS HTTP 客户端测试：泛型响应解析与带 query 路径的签名（签名字符串只含 path）。 */
class OmsHttpClientTest {

  private HttpServer server;
  private OmsProperties properties;
  private OmsHttpClient client;

  private volatile String receivedAppId;
  private volatile String receivedTimestamp;
  private volatile String receivedNonce;
  private volatile String receivedSign;

  @BeforeEach
  void setUp() throws Exception {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    server.setExecutor(Executors.newSingleThreadExecutor());
    server.createContext(
        "/api/v1/open/products",
        exchange -> {
          receivedAppId = exchange.getRequestHeaders().getFirst("X-App-Id");
          receivedTimestamp = exchange.getRequestHeaders().getFirst("X-Timestamp");
          receivedNonce = exchange.getRequestHeaders().getFirst("X-Nonce");
          receivedSign = exchange.getRequestHeaders().getFirst("X-Sign");

          String json =
              "{\"code\":0,\"message\":\"成功\",\"data\":{\"total\":1,\"records\":["
                  + "{\"skuId\":1001,\"skuNo\":\"8885020710595\",\"spuNo\":\"8885020710595\","
                  + "\"name\":\"HCG Pregnancy Rapid Test\",\"spec\":null,\"registrationNo\":null,"
                  + "\"udi\":null,\"price\":4.80,\"status\":1,\"availableStock\":100}]}}";
          byte[] body = json.getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().set("Content-Type", "application/json");
          exchange.sendResponseHeaders(200, body.length);
          try (var output = exchange.getResponseBody()) {
            output.write(body);
          }
        });
    server.start();

    properties = new OmsProperties();
    properties.setEnabled(true);
    properties.setGatewayUrl("http://localhost:" + server.getAddress().getPort());
    properties.setAppId("demo-mall");
    properties.setAppSecret("demo-mall-secret-change-me");
    properties.setMerchantId("1");
    client = new OmsHttpClient(properties, new ObjectMapper());
  }

  @AfterEach
  void tearDown() {
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  void getShouldParseGenericResultAndSignPathWithoutQuery() {
    OmsResult<OpenProductPage> result =
        client.get("/api/v1/open/products?keyword=&page=1&size=100", OpenProductPage.class);

    assertNotNull(result.data());
    assertEquals(1, result.data().total());
    assertEquals(1001L, result.data().records().get(0).skuId());
    assertEquals(4.80, result.data().records().get(0).price().doubleValue());

    assertEquals("demo-mall", receivedAppId);
    String expectedSign =
        OmsSigner.sign(
            "demo-mall-secret-change-me",
            "GET",
            "/api/v1/open/products",
            receivedTimestamp,
            receivedNonce,
            OmsSigner.sha256Hex(""));
    assertEquals(expectedSign, receivedSign);
  }
}
