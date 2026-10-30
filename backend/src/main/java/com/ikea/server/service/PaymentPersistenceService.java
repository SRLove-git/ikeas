package com.ikea.server.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/** 支付交易与回调事件的持久化去重层。 */
@Service
public class PaymentPersistenceService {

  private static final int ATTEMPT_PENDING = 0;
  private static final int ATTEMPT_SUCCEEDED = 1;
  private static final int ATTEMPT_FAILED = 2;
  private static final int ATTEMPT_TTL_MINUTES = 15;

  private final JdbcTemplate jdbcTemplate;

  public PaymentPersistenceService(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  /**
   * 使用已验签的回调元数据生成不含密钥的事件键。返回 false 表示已处理过。
   */
  public boolean recordCallbackIfAbsent(
      String provider, String eventIdentity, String orderNo, String providerTxnNo) {
    String eventKey = sha256(provider + "\n" + eventIdentity);
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

  /**
   * YeahPay 会话只有确认失败才允许重建；时间经过不代表渠道会话已失效。
   */
  public boolean reservePaymentAttempt(String orderNo, String provider, String channel) {
    int changed =
        jdbcTemplate.update(
            """
            INSERT INTO payment_attempt
              (order_no, provider, channel, status)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (order_no) DO UPDATE
            SET provider = EXCLUDED.provider,
                channel = EXCLUDED.channel,
                status = EXCLUDED.status,
                checkout_url = NULL,
                query_status = NULL,
                query_code = NULL,
                query_trace_id = NULL,
                last_checked_at = NULL,
                created_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE payment_attempt.status = ?
               OR (payment_attempt.provider = 'stripe' AND EXCLUDED.provider = 'stripe'
                   AND payment_attempt.status = ?
                   AND payment_attempt.updated_at
                       < CURRENT_TIMESTAMP - (? * INTERVAL '1 minute'))
            """,
            orderNo,
            provider,
            channel,
            ATTEMPT_PENDING,
            ATTEMPT_FAILED,
            ATTEMPT_PENDING,
            ATTEMPT_TTL_MINUTES);
    return changed == 1;
  }

  public record PaymentAttempt(
      String orderNo, String provider, String channel, int status, String checkoutUrl,
      String queryStatus, LocalDateTime lastCheckedAt, LocalDateTime createdAt) {}

  public Optional<PaymentAttempt> findAttempt(String orderNo) {
    return readAttempt(orderNo, false);
  }

  /** 必须在事务中调用；串行处理同一会话的查询、回调和重试。 */
  public Optional<PaymentAttempt> findAttemptForUpdate(String orderNo) {
    return readAttempt(orderNo, true);
  }

  private Optional<PaymentAttempt> readAttempt(String orderNo, boolean lock) {
    String sql = """
        SELECT order_no, provider, channel, status, checkout_url, query_status,
               last_checked_at, created_at
        FROM payment_attempt WHERE order_no = ?
        """ + (lock ? " FOR UPDATE" : "");
    return jdbcTemplate.query(sql, (rs, row) -> new PaymentAttempt(
        rs.getString("order_no"), rs.getString("provider"), rs.getString("channel"),
        rs.getInt("status"), rs.getString("checkout_url"), rs.getString("query_status"),
        rs.getObject("last_checked_at", LocalDateTime.class),
        rs.getObject("created_at", LocalDateTime.class)), orderNo).stream().findFirst();
  }

  public void saveCheckoutUrl(String orderNo, String provider, String checkoutUrl,
      LocalDateTime createdAt) {
    jdbcTemplate.update("""
        UPDATE payment_attempt SET checkout_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_no = ? AND provider = ? AND status = ? AND created_at = ?
        """, checkoutUrl, orderNo, provider, ATTEMPT_PENDING, createdAt);
  }

  public void recordQueryResult(String orderNo, String status, String code, String traceId) {
    jdbcTemplate.update("""
        UPDATE payment_attempt
        SET query_status = ?, query_code = ?, query_trace_id = ?,
            last_checked_at = (clock_timestamp() AT TIME ZONE 'UTC')
        WHERE order_no = ? AND provider = 'yeahpay'
        """, status, code, traceId, orderNo);
  }

  public Optional<String> findLastFailedTransactionNo(String orderNo) {
    return jdbcTemplate.query("""
        SELECT last_failed_txn_no FROM payment_attempt
        WHERE order_no = ? AND last_failed_txn_no IS NOT NULL
        """, (rs, row) -> rs.getString("last_failed_txn_no"), orderNo).stream().findFirst();
  }

  public void rememberFailedTransactionNo(String orderNo, String transactionNo) {
    jdbcTemplate.update("""
        UPDATE payment_attempt SET last_failed_txn_no = ?
        WHERE order_no = ? AND provider = 'yeahpay' AND status = ?
        """, transactionNo, orderNo, ATTEMPT_PENDING);
  }

  public void markPaymentAttemptSucceeded(String orderNo, String provider) {
    jdbcTemplate.update(
        """
        UPDATE payment_attempt
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_no = ? AND provider = ?
        """,
        ATTEMPT_SUCCEEDED,
        orderNo,
        provider);
  }

  public void markPaymentAttemptFailed(String orderNo, String provider) {
    jdbcTemplate.update(
        """
        UPDATE payment_attempt
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE order_no = ? AND provider = ? AND status = ?
        """,
        ATTEMPT_FAILED,
        orderNo,
        provider,
        ATTEMPT_PENDING);
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

    Map<String, Object> stored;
    try {
      stored =
          jdbcTemplate.queryForMap(
              """
              SELECT provider, provider_txn_no, amount_minor, currency, status
              FROM payment_transaction
              WHERE order_no = ?
              """,
              orderNo);
    } catch (EmptyResultDataAccessException ex) {
      throw new IllegalArgumentException("支付交易已绑定其他订单，拒绝覆盖", ex);
    }
    String storedProvider = String.valueOf(stored.get("provider"));
    String storedTxnNo = String.valueOf(stored.get("provider_txn_no"));
    long storedAmount = ((Number) stored.get("amount_minor")).longValue();
    String storedCurrency = String.valueOf(stored.get("currency"));
    int storedStatus = ((Number) stored.get("status")).intValue();
    if (!provider.equalsIgnoreCase(storedProvider)
        || !providerTxnNo.equals(storedTxnNo)
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
