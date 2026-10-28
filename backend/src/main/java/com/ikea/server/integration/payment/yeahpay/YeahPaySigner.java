package com.ikea.server.integration.payment.yeahpay;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/** YeahPay V2.0 SHA-512 签名工具，签名必须使用原始 JSON 字符串。 */
public final class YeahPaySigner {

  public static final String VERSION = "1.0";
  public static final String ALGORITHM = "SHA-512";
  private static final String NONCE_CHARACTERS =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  private static final SecureRandom RANDOM = new SecureRandom();

  private YeahPaySigner() {}

  /**
   * stringToSign = url\nappId\ntimestamp\nversion\nnonce\nrawBody\napiKey，然后
   * SHA-512 + Base64。
   */
  public static String sign(
      String urlForSignature,
      String appId,
      String timestamp,
      String version,
      String nonce,
      String rawBody,
      String apiKey) {
    String value =
        nullToEmpty(urlForSignature)
            + "\n"
            + nullToEmpty(appId)
            + "\n"
            + nullToEmpty(timestamp)
            + "\n"
            + nullToEmpty(version)
            + "\n"
            + nullToEmpty(nonce)
            + "\n"
            + nullToEmpty(rawBody)
            + "\n"
            + nullToEmpty(apiKey);
    try {
      byte[] digest =
          MessageDigest.getInstance(ALGORITHM).digest(value.getBytes(StandardCharsets.UTF_8));
      return Base64.getEncoder().encodeToString(digest);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-512 不可用", ex);
    }
  }

  public static boolean verify(
      String suppliedSignature,
      String urlForSignature,
      String appId,
      String timestamp,
      String version,
      String nonce,
      String rawBody,
      String apiKey) {
    if (suppliedSignature == null || suppliedSignature.isBlank()) {
      return false;
    }
    String expected =
        sign(urlForSignature, appId, timestamp, version, nonce, rawBody, apiKey);
    return MessageDigest.isEqual(
        expected.getBytes(StandardCharsets.US_ASCII),
        suppliedSignature.getBytes(StandardCharsets.US_ASCII));
  }

  public static String nonce() {
    StringBuilder result = new StringBuilder(16);
    for (int index = 0; index < 16; index++) {
      result.append(NONCE_CHARACTERS.charAt(RANDOM.nextInt(NONCE_CHARACTERS.length())));
    }
    return result.toString();
  }

  public static String timestamp() {
    return String.valueOf(System.currentTimeMillis());
  }

  private static String nullToEmpty(String value) {
    return value == null ? "" : value;
  }
}
