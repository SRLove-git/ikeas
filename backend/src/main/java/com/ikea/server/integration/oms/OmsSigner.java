package com.ikea.server.integration.oms;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/** OMS Open API HMAC-SHA256 签名工具（对齐 oms/docs/open-api.md 第 2 节）。 */
public final class OmsSigner {

  private static final SecureRandom RANDOM = new SecureRandom();

  private OmsSigner() {}

  /** stringToSign = METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256_HEX(BODY)，签名为小写 hex。 */
  public static String sign(
      String secret, String method, String path, String timestamp, String nonce, String bodySha256Hex) {
    String stringToSign =
        method + "\n" + path + "\n" + timestamp + "\n" + nonce + "\n" + bodySha256Hex;
    return hex(hmacSha256(secret, stringToSign));
  }

  public static String sha256Hex(String body) {
    return hex(sha256(body == null ? "" : body));
  }

  public static String nonce() {
    byte[] bytes = new byte[16];
    RANDOM.nextBytes(bytes);
    return hex(bytes);
  }

  public static String timestamp() {
    return String.valueOf(System.currentTimeMillis() / 1000);
  }

  private static byte[] sha256(String value) {
    try {
      return MessageDigest.getInstance("SHA-256")
          .digest(value.getBytes(StandardCharsets.UTF_8));
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 不可用", ex);
    }
  }

  private static byte[] hmacSha256(String secret, String value) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
      return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
    } catch (Exception ex) {
      throw new IllegalStateException("HmacSHA256 签名失败", ex);
    }
  }

  private static String hex(byte[] bytes) {
    return HexFormat.of().formatHex(bytes);
  }
}
