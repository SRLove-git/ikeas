package com.ikea.server.integration.oms;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/** OMS 签名工具测试：固定向量对齐 oms/docs/open-api.md 第 2 节签名方案。 */
class OmsSignerTest {

  private static final String BODY = "{\"externalOrderNo\":\"M1\",\"items\":[{\"skuId\":1,\"quantity\":2}]}";

  @Test
  void sha256HexShouldMatchKnownVectors() {
    // SHA-256("") 的公开标准值
    assertEquals(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        OmsSigner.sha256Hex(""));
    assertEquals(
        "8b7c2e50702d014661d30c3dd60871b7cfcd14d2da633cdafa155416d60f4931",
        OmsSigner.sha256Hex(BODY));
  }

  @Test
  void signShouldMatchKnownVector() {
    // 期望值由 openssl 按 OMS 文档算法独立计算：
    // HMAC-SHA256(demo-mall-secret, "POST\n/api/v1/open/orders\n1753000000\nabc123\n" + bodySha)
    String sign =
        OmsSigner.sign(
            "demo-mall-secret",
            "POST",
            "/api/v1/open/orders",
            "1753000000",
            "abc123",
            OmsSigner.sha256Hex(BODY));
    assertEquals("2b6909e4b34cdfbbe8c5f8aaa9c30209d6e6e7b3ef9846c90fe567acf5acfba9", sign);
  }

  @Test
  void nonceShouldBeUniqueHex() {
    String first = OmsSigner.nonce();
    String second = OmsSigner.nonce();
    assertNotEquals(first, second);
    assertTrue(first.matches("[0-9a-f]{32}"));
    assertTrue(second.matches("[0-9a-f]{32}"));
  }
}
