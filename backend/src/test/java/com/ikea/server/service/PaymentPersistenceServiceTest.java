package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class PaymentPersistenceServiceTest {

  @Test
  void transactionRecordShouldAcceptTheSameStoredProviderTransaction() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    when(jdbc.queryForMap(any(String.class), eq("yeahpay"), eq("ORD-1")))
        .thenReturn(
            Map.of(
                "provider_txn_no", "YP-1",
                "amount_minor", 1234L,
                "currency", "SGD",
                "status", 2));
    PaymentPersistenceService service = new PaymentPersistenceService(jdbc);

    assertDoesNotThrow(
        () -> service.recordSuccessfulTransaction("yeahpay", "ORD-1", "YP-1", 1234L, "SGD"));
  }

  @Test
  void transactionRecordShouldRejectAConflictingProviderTransaction() {
    JdbcTemplate jdbc = mock(JdbcTemplate.class);
    when(jdbc.queryForMap(any(String.class), eq("yeahpay"), eq("ORD-1")))
        .thenReturn(
            Map.of(
                "provider_txn_no", "YP-OTHER",
                "amount_minor", 1234L,
                "currency", "SGD",
                "status", 2));
    PaymentPersistenceService service = new PaymentPersistenceService(jdbc);

    assertThrows(
        IllegalArgumentException.class,
        () -> service.recordSuccessfulTransaction("yeahpay", "ORD-1", "YP-1", 1234L, "SGD"));
  }
}
