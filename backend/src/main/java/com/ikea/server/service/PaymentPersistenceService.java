package com.ikea.server.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** 支付交易与回调事件的持久化去重层。 */
@Service
public class PaymentPersistenceService {

  private final JdbcTemplate jdbcTemplate;

  public PaymentPersistenceService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  /**
   * 使用已验签的回调元数据生成不含密钥的事件键。返回 false 表示已处理过。
   */
  public boolean recordCallbackIfAbsent(
      String provider,
      String timestamp,
      String nonce,
      String orderNo,
      String providerTxnNo) {
    String eventKey = sha256(provider + "\n" + timestamp + "\n" + nonce);
    int inserted =
        jdbcTemplate.update(
            """
            INSERT INTO payment_callback_event
              (event_key, provider, order_no, provider_txn_no)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (event_key) DO NOTHING
            """,
            eventKey,
            provider,
            orderNo,
            providerTxnNo);
    return inserted == 1;
  }

  /** 保存成功交易；同一订单若出现不同渠道交易号则拒绝。 */
  public void recordSuccessfulTransaction(
      String provider,
      String orderNo,
      String providerTxnNo,
      long amountMinor,
      String currency) {
    jdbcTemplate.update(
        """
        INSERT INTO payment_transaction
          (provider, order_no, provider_txn_no, amount_minor, currency, status)
        VALUES (?, ?, ?, ?, ?, 2)
        ON CONFLICT DO NOTHING
        """,
        provider,
        orderNo,
        providerTxnNo,
        amountMinor,
        currency.toUpperCase());

    Map<String, Object> stored =
        jdbcTemplate.queryForMap(
            """
            SELECT provider_txn_no, amount_minor, currency, status
            FROM payment_transaction
            WHERE provider = ? AND order_no = ?
            """,
            provider,
            orderNo);
    String storedTxnNo = String.valueOf(stored.get("provider_txn_no"));
    long storedAmount = ((Number) stored.get("amount_minor")).longValue();
    String storedCurrency = String.valueOf(stored.get("currency"));
    int storedStatus = ((Number) stored.get("status")).intValue();
    if (!providerTxnNo.equals(storedTxnNo)
        || amountMinor != storedAmount
        || !currency.equalsIgnoreCase(storedCurrency)
        || storedStatus != 2) {
      throw new IllegalArgumentException("订单已绑定其他支付交易，拒绝覆盖");
    }
  }

  private static String sha256(String value) {
    try {
      byte[] digest =
          MessageDigest.getInstance("SHA-256")
              .digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException ex) {
      throw new IllegalStateException("SHA-256 不可用", ex);
    }
  }
}
