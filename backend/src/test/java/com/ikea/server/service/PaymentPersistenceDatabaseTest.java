package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.ikea.server.service.PaymentPersistenceService.PaymentAttempt;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 显式设置 PAYMENT_TEST_DATABASE_URL 后才运行，且仅允许本地回环地址。
 * 配合独立临时 PostgreSQL 16 容器使用；每次执行建立并清理独立随机 schema。
 */
@EnabledIfEnvironmentVariable(named = "PAYMENT_TEST_DATABASE_URL", matches = ".+")
class PaymentPersistenceDatabaseTest {

  private static JdbcTemplate adminJdbc;
  private static JdbcTemplate jdbc;
  private static PaymentPersistenceService persistence;
  private static TransactionTemplate transactions;
  private static String schema;

  @BeforeAll
  static void initializeIsolatedSchema() {
    String url = System.getenv("PAYMENT_TEST_DATABASE_URL");
    assertTrue(
        url.matches("jdbc:postgresql://127\\.0\\.0\\.1:[0-9]+/[A-Za-z0-9_]+"),
        "Payment database tests require an explicit loopback host and port");
    String username = System.getenv().getOrDefault("PAYMENT_TEST_DATABASE_USER", "postgres");
    String password = System.getenv().getOrDefault("PAYMENT_TEST_DATABASE_PASSWORD", "");
    DriverManagerDataSource adminDataSource = new DriverManagerDataSource(url, username, password);
    adminJdbc = new JdbcTemplate(adminDataSource);
    schema = "payment_it_" + UUID.randomUUID().toString().replace("-", "");
    // schema 仅由固定前缀和 UUID 十六进制组成，不接受外部 SQL 标识符。
    adminJdbc.execute("CREATE SCHEMA " + schema);

    DriverManagerDataSource dataSource = new DriverManagerDataSource(url, username, password);
    Properties connectionProperties = new Properties();
    connectionProperties.setProperty("currentSchema", schema);
    connectionProperties.setProperty("options", "-c TimeZone=UTC -c lock_timeout=5000");
    connectionProperties.setProperty("connectTimeout", "5");
    connectionProperties.setProperty("socketTimeout", "10");
    dataSource.setConnectionProperties(connectionProperties);
    ResourceDatabasePopulator migrations = new ResourceDatabasePopulator(
        new ClassPathResource("db/migration/V22__payment_transactions.sql"),
        new ClassPathResource("db/migration/V23__payment_safety.sql"),
        new ClassPathResource("db/migration/V24__payment_reconciliation.sql"));
    migrations.setSqlScriptEncoding("UTF-8");
    migrations.execute(dataSource);
    jdbc = new JdbcTemplate(dataSource);
    persistence = new PaymentPersistenceService(jdbc);
    transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
  }

  @BeforeEach
  void clearOnlyIsolatedTestTables() {
    jdbc.execute("TRUNCATE TABLE payment_callback_event, payment_transaction, payment_attempt");
  }

  @AfterAll
  static void removeIsolatedSchema() {
    if (adminJdbc != null && schema != null) {
      adminJdbc.execute("DROP SCHEMA " + schema + " CASCADE");
    }
  }

  @Test
  void checkoutAndQueryFieldsRoundTripThroughPostgres() {
    assertTrue(persistence.reservePaymentAttempt("ORD-FIELDS", "yeahpay", "visa"));
    PaymentAttempt initial = persistence.findAttempt("ORD-FIELDS").orElseThrow();
    assertNotNull(initial.createdAt());
    assertNull(initial.checkoutUrl());
    persistence.saveCheckoutUrl(
        "ORD-FIELDS", "yeahpay", "https://payment.yeahpay.net/checkout/test", initial.createdAt());
    persistence.recordQueryResult("ORD-FIELDS", "pending", "0", "trace-fields");

    PaymentAttempt stored = persistence.findAttempt("ORD-FIELDS").orElseThrow();
    assertEquals("ORD-FIELDS", stored.orderNo());
    assertEquals("yeahpay", stored.provider());
    assertEquals("visa", stored.channel());
    assertEquals(0, stored.status());
    assertEquals("https://payment.yeahpay.net/checkout/test", stored.checkoutUrl());
    assertEquals("pending", stored.queryStatus());
    assertNotNull(stored.lastCheckedAt());
    assertEquals(initial.createdAt(), stored.createdAt());
    Map<String, Object> diagnostic = jdbc.queryForMap(
        "SELECT query_code, query_trace_id FROM payment_attempt WHERE order_no = ?", "ORD-FIELDS");
    assertEquals("0", diagnostic.get("query_code"));
    assertEquals("trace-fields", diagnostic.get("query_trace_id"));
  }

  @Test
  void oldPendingYeahPayAttemptCannotBeRecreatedByAnyProvider() {
    assertTrue(persistence.reservePaymentAttempt("ORD-OLD", "yeahpay", "visa"));
    jdbc.update("""
        UPDATE payment_attempt
        SET created_at = CURRENT_TIMESTAMP - INTERVAL '2 hours',
            updated_at = CURRENT_TIMESTAMP - INTERVAL '2 hours'
        WHERE order_no = ?
        """, "ORD-OLD");

    assertFalse(persistence.reservePaymentAttempt("ORD-OLD", "yeahpay", "mastercard"));
    assertFalse(persistence.reservePaymentAttempt("ORD-OLD", "stripe", "visa"));
    PaymentAttempt stored = persistence.findAttempt("ORD-OLD").orElseThrow();
    assertEquals("yeahpay", stored.provider());
    assertEquals("visa", stored.channel());
    assertEquals(0, stored.status());
  }

  @Test
  void confirmedFailureCanRestartAndClearsOldCheckoutAndQueryCache() {
    assertTrue(persistence.reservePaymentAttempt("ORD-RETRY", "yeahpay", "visa"));
    jdbc.update("""
        UPDATE payment_attempt SET created_at = CURRENT_TIMESTAMP - INTERVAL '1 hour'
        WHERE order_no = ?
        """, "ORD-RETRY");
    LocalDateTime previousGeneration =
        persistence.findAttempt("ORD-RETRY").orElseThrow().createdAt();
    persistence.saveCheckoutUrl(
        "ORD-RETRY", "yeahpay", "https://payment.yeahpay.net/checkout/old", previousGeneration);
    persistence.recordQueryResult("ORD-RETRY", "failed", "0", "trace-old");
    persistence.markPaymentAttemptFailed("ORD-RETRY", "yeahpay");

    assertTrue(persistence.reservePaymentAttempt("ORD-RETRY", "yeahpay", "mastercard"));
    // 旧创建请求迟到的返回值不得覆盖新一轮会话。
    persistence.saveCheckoutUrl(
        "ORD-RETRY", "yeahpay", "https://payment.yeahpay.net/checkout/stale", previousGeneration);
    PaymentAttempt stored = persistence.findAttempt("ORD-RETRY").orElseThrow();
    assertEquals(0, stored.status());
    assertEquals("mastercard", stored.channel());
    assertNull(stored.checkoutUrl());
    assertNull(stored.queryStatus());
    assertNull(stored.lastCheckedAt());
    Map<String, Object> diagnostic = jdbc.queryForMap(
        "SELECT query_code, query_trace_id FROM payment_attempt WHERE order_no = ?", "ORD-RETRY");
    assertNull(diagnostic.get("query_code"));
    assertNull(diagnostic.get("query_trace_id"));
    assertTrue(stored.createdAt().isAfter(previousGeneration));
  }

  @Test
  void successfulAttemptCannotBeRestartedOrDowngradedToFailure() {
    assertTrue(persistence.reservePaymentAttempt("ORD-PAID", "yeahpay", "visa"));
    persistence.markPaymentAttemptSucceeded("ORD-PAID", "yeahpay");
    persistence.markPaymentAttemptFailed("ORD-PAID", "yeahpay");

    assertFalse(persistence.reservePaymentAttempt("ORD-PAID", "yeahpay", "visa"));
    assertFalse(persistence.reservePaymentAttempt("ORD-PAID", "stripe", "visa"));
    assertEquals(1, persistence.findAttempt("ORD-PAID").orElseThrow().status());
  }

  @Test
  void failedProviderTransactionIdentitySurvivesStartingANewAttempt() {
    assertTrue(persistence.reservePaymentAttempt("ORD-FAILED-TXN", "yeahpay", "visa"));
    assertTrue(persistence.findLastFailedTransactionNo("ORD-FAILED-TXN").isEmpty());
    persistence.rememberFailedTransactionNo("ORD-FAILED-TXN", "YP-FAILED-1");
    persistence.markPaymentAttemptFailed("ORD-FAILED-TXN", "yeahpay");

    assertTrue(persistence.reservePaymentAttempt("ORD-FAILED-TXN", "yeahpay", "mastercard"));
    assertEquals("YP-FAILED-1",
        persistence.findLastFailedTransactionNo("ORD-FAILED-TXN").orElseThrow());
    assertEquals(0, persistence.findAttempt("ORD-FAILED-TXN").orElseThrow().status());
  }

  @Test
  void concurrentReservationsHaveExactlyOneWinner() throws Exception {
    int contenders = 6;
    ExecutorService executor = Executors.newFixedThreadPool(contenders);
    CountDownLatch ready = new CountDownLatch(contenders);
    CountDownLatch start = new CountDownLatch(1);
    List<Future<Boolean>> reservations = new ArrayList<>();
    try {
      for (int i = 0; i < contenders; i++) {
        reservations.add(executor.submit(() -> {
          ready.countDown();
          await(start);
          return persistence.reservePaymentAttempt("ORD-RACE", "yeahpay", "visa");
        }));
      }
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      int winners = 0;
      for (Future<Boolean> reservation : reservations) {
        if (reservation.get(10, TimeUnit.SECONDS)) winners++;
      }
      assertEquals(1, winners);
      assertEquals(1, jdbc.queryForObject(
          "SELECT count(*) FROM payment_attempt WHERE order_no = ?", Integer.class, "ORD-RACE"));
    } finally {
      start.countDown();
      executor.shutdownNow();
      assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
    }
  }

  @Test
  void settlementFailureRollsBackQueryAttemptAndTransactionTogether() {
    assertTrue(persistence.reservePaymentAttempt("ORD-ROLLBACK", "yeahpay", "visa"));

    assertThrows(IllegalStateException.class, () -> transactions.executeWithoutResult(status -> {
      assertTrue(persistence.findAttemptForUpdate("ORD-ROLLBACK").isPresent());
      persistence.recordQueryResult("ORD-ROLLBACK", "paid", "0", "trace-rollback");
      persistence.markPaymentAttemptSucceeded("ORD-ROLLBACK", "yeahpay");
      persistence.recordSuccessfulTransaction("yeahpay", "ORD-ROLLBACK", "YP-ROLLBACK", 1234L, "SGD");
      throw new IllegalStateException("simulated downstream settlement failure");
    }));

    PaymentAttempt stored = persistence.findAttempt("ORD-ROLLBACK").orElseThrow();
    assertEquals(0, stored.status());
    assertNull(stored.queryStatus());
    assertNull(stored.lastCheckedAt());
    assertEquals(0, jdbc.queryForObject(
        "SELECT count(*) FROM payment_transaction WHERE order_no = ?", Integer.class, "ORD-ROLLBACK"));
  }

  @Test
  void forUpdateLockSerializesFailureBehindCommittedSuccess() throws Exception {
    assertTrue(persistence.reservePaymentAttempt("ORD-LOCK", "yeahpay", "visa"));
    ExecutorService executor = Executors.newFixedThreadPool(2);
    CountDownLatch locked = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    CountDownLatch secondStarted = new CountDownLatch(1);
    try {
      Future<?> success = executor.submit(() -> transactions.executeWithoutResult(status -> {
        assertEquals(0, persistence.findAttemptForUpdate("ORD-LOCK").orElseThrow().status());
        locked.countDown();
        await(release);
        persistence.markPaymentAttemptSucceeded("ORD-LOCK", "yeahpay");
      }));
      assertTrue(locked.await(5, TimeUnit.SECONDS));
      Future<Integer> lateFailure = executor.submit(() -> transactions.execute(status -> {
        secondStarted.countDown();
        PaymentAttempt afterLock = persistence.findAttemptForUpdate("ORD-LOCK").orElseThrow();
        persistence.markPaymentAttemptFailed("ORD-LOCK", "yeahpay");
        return afterLock.status();
      }));
      assertTrue(secondStarted.await(5, TimeUnit.SECONDS));
      assertThrows(TimeoutException.class, () -> lateFailure.get(200, TimeUnit.MILLISECONDS));
      release.countDown();
      success.get(5, TimeUnit.SECONDS);
      assertEquals(1, lateFailure.get(5, TimeUnit.SECONDS));
      assertEquals(1, persistence.findAttempt("ORD-LOCK").orElseThrow().status());
    } finally {
      release.countDown();
      executor.shutdownNow();
      assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));
    }
  }

  private static void await(CountDownLatch latch) {
    try {
      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new IllegalStateException("Timed out coordinating isolated database test");
      }
    } catch (InterruptedException ex) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Database test interrupted", ex);
    }
  }
}
