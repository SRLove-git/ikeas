package com.ikea.server.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.ikea.server.constant.OrderStatus;
import com.ikea.server.dto.payment.PaymentDtos.PaymentStatusResponse;
import com.ikea.server.entity.Order;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient;
import com.ikea.server.integration.payment.yeahpay.YeahPayClient.QueryOrderResult;
import com.ikea.server.integration.payment.yeahpay.YeahPayProperties;
import com.ikea.server.mapper.OrderMapper;
import com.ikea.server.service.PaymentPersistenceService.PaymentAttempt;
import com.ikea.server.web.ResourceNotFoundException;
import com.ikea.server.web.UnauthorizedException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class PaymentReconciliationServiceTest {

  private OrderMapper orderMapper;
  private OrderService orderService;
  private YeahPayClient client;
  private PaymentPersistenceService persistence;
  private PaymentReconciliationService service;
  private Order order;

  @BeforeEach
  void setUp() {
    orderMapper = mock(OrderMapper.class);
    orderService = mock(OrderService.class);
    client = mock(YeahPayClient.class);
    persistence = mock(PaymentPersistenceService.class);
    YeahPayProperties properties = new YeahPayProperties();
    properties.setMerchantId("merchant-test");
    service =
        new PaymentReconciliationService(orderMapper, orderService, client, properties, persistence);
    order = new Order();
    order.setOrderNo("ORD-QUERY");
    order.setUserId(42L);
    order.setCurrency("SGD");
    order.setTotalAmount(new BigDecimal("12.34"));
    order.setStatus(OrderStatus.PENDING_PAYMENT.code());
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(order);
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(attempt(0, null, null)));
    when(client.isConfigured()).thenReturn(true);
  }

  @Test
  void unauthenticatedCallerCannotQueryAnyOrder() {
    assertThrows(UnauthorizedException.class, () -> service.refresh(null, "ORD-QUERY"));
    verifyNoInteractions(orderMapper, client, persistence, orderService);
  }

  @Test
  void anotherUsersOrderIsRejectedBeforeAnyProviderCall() {
    order.setUserId(99L);
    assertThrows(ResourceNotFoundException.class, () -> service.refresh(42L, "ORD-QUERY"));
    verifyNoInteractions(client, persistence, orderService);
  }

  @Test
  void missingOrderIsNotTreatedAsPaidOrRetryable() {
    when(orderMapper.selectOne(any(Wrapper.class))).thenReturn(null);
    assertThrows(ResourceNotFoundException.class, () -> service.refresh(42L, "ORD-MISSING"));
    verifyNoInteractions(client, persistence, orderService);
  }

  @ParameterizedTest
  @CsvSource({"2,paid", "3,paid", "4,paid", "5,closed", "6,closed", "7,closed"})
  void alreadyFinalLocalOrdersAreNeverQueriedAgain(int status, String expected) {
    order.setStatus(status);
    assertEquals(new PaymentStatusResponse(expected, false), service.refresh(42L, "ORD-QUERY"));
    verifyNoInteractions(client, persistence, orderService);
  }

  @Test
  void orderWithoutPaymentAttemptCanStartCheckout() {
    when(persistence.findAttemptForUpdate("ORD-QUERY")).thenReturn(Optional.empty());
    assertEquals(
        new PaymentStatusResponse("not_started", true), service.refresh(42L, "ORD-QUERY"));
    verifyNoInteractions(client, orderService);
  }

  @Test
  void otherProviderAttemptIsNotQueriedThroughYeahPay() {
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(new PaymentAttempt(
            "ORD-QUERY", "stripe", "visa", 0, null, null, null,
            LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5))));
    assertEquals(
        new PaymentStatusResponse("unavailable", false), service.refresh(42L, "ORD-QUERY"));
    verifyNoInteractions(client, orderService);
  }

  @Test
  void notFoundAtProviderDoesNotReleaseTheAttempt() {
    when(client.queryOrder("ORD-QUERY"))
        .thenReturn(new QueryOrderResult(false, null, null, null, null, null, null, "10012", "trace"));
    assertEquals(new PaymentStatusResponse("unknown", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence).recordQueryResult("ORD-QUERY", "unknown", "10012", "trace");
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
    verifyNoInteractions(orderService);
  }

  @Test
  void pendingProviderOrderRemainsLocked() {
    when(client.queryOrder("ORD-QUERY")).thenReturn(query(0));
    assertEquals(new PaymentStatusResponse("pending", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence).recordQueryResult("ORD-QUERY", "pending", "0", "trace");
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
  }

  @ParameterizedTest
  @CsvSource({"6,closed", "8,failed"})
  void onlyVerifiedTerminalFailureAllowsAnotherCheckout(int status, String expected) {
    when(client.queryOrder("ORD-QUERY")).thenReturn(query(status));
    assertEquals(new PaymentStatusResponse(expected, true), service.refresh(42L, "ORD-QUERY"));
    verify(persistence).rememberFailedTransactionNo("ORD-QUERY", "YP-123");
    verify(persistence).markPaymentAttemptFailed("ORD-QUERY", "yeahpay");
    verify(persistence).recordQueryResult("ORD-QUERY", expected, "0", "trace");
    verifyNoInteractions(orderService);
  }

  @ParameterizedTest
  @ValueSource(ints = {6, 8})
  void terminalFailureWithoutAmountCannotUnlockPayment(int status) {
    when(client.queryOrder("ORD-QUERY"))
        .thenReturn(new QueryOrderResult(
            true, status, "merchant-test", "ORD-QUERY", null, null, "SGD", "0", "trace"));
    assertEquals(new PaymentStatusResponse("unknown", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
  }

  @ParameterizedTest
  @ValueSource(ints = {6, 8})
  void previouslyFailedTransactionCannotReleaseANewPaymentAttempt(int status) {
    when(client.queryOrder("ORD-QUERY")).thenReturn(query(status));
    when(persistence.findLastFailedTransactionNo("ORD-QUERY"))
        .thenReturn(Optional.of("YP-123"));

    assertEquals(new PaymentStatusResponse("unknown", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
    verify(persistence, never()).rememberFailedTransactionNo(any(), any());
    verify(persistence).recordQueryResult("ORD-QUERY", "unknown", "0", "trace");
  }

  @ParameterizedTest
  @ValueSource(ints = {6, 8})
  void failureWithoutTransactionIdentityCannotReleasePayment(int status) {
    when(client.queryOrder("ORD-QUERY"))
        .thenReturn(new QueryOrderResult(
            true, status, "merchant-test", "ORD-QUERY", null, 1234L, "SGD", "0", "trace"));

    assertEquals(new PaymentStatusResponse("unknown", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
    verify(persistence, never()).rememberFailedTransactionNo(any(), any());
  }

  @ParameterizedTest
  @ValueSource(ints = {10, 11, 12, 99})
  void unsupportedProviderStatesNeverClaimPaymentOrUnlock(int status) {
    when(client.queryOrder("ORD-QUERY")).thenReturn(query(status));
    assertEquals(new PaymentStatusResponse("unknown", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
    verify(persistence, never()).markPaymentAttemptSucceeded(any(), any());
    verifyNoInteractions(orderService);
  }

  @Test
  void matchingPaymentIsPersistedAndAppliedOnlyOnce() {
    when(client.queryOrder("ORD-QUERY")).thenReturn(query(2));
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(attempt(0, null, null)), Optional.of(attempt(1, "paid", null)));

    assertEquals(new PaymentStatusResponse("paid", false), service.refresh(42L, "ORD-QUERY"));
    assertEquals(new PaymentStatusResponse("paid", false), service.refresh(42L, "ORD-QUERY"));

    verify(client).queryOrder("ORD-QUERY");
    verify(persistence)
        .recordSuccessfulTransaction("yeahpay", "ORD-QUERY", "YP-123", 1234L, "SGD");
    verify(persistence).markPaymentAttemptSucceeded("ORD-QUERY", "yeahpay");
    verify(orderService)
        .markPaidByGateway(
            "ORD-QUERY", "yeahpay", "YP-123", "ORD-QUERY", new BigDecimal("12.34"), "SGD");
  }

  @Test
  void directWalletAttemptQueriesProviderOrderAndSettlesWithOmsWalletChannel() {
    PaymentAttempt directAttempt = new PaymentAttempt(
        "ORD-QUERY", "yeahpay", "paynow", 0, "QR-PAYLOAD", null, null,
        LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5), "DPROVIDER1", "qr");
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(directAttempt));
    when(client.queryOrder("DPROVIDER1")).thenReturn(new QueryOrderResult(
        true, 2, "merchant-test", "DPROVIDER1", "YP-PAYNOW", 1234L, "SGD", "0", "trace"));

    assertEquals(new PaymentStatusResponse("paid", false), service.refresh(42L, "ORD-QUERY"));

    verify(client).queryOrder("DPROVIDER1");
    verify(orderService).markPaidByGateway(
        "ORD-QUERY", "paynow", "YP-PAYNOW", "DPROVIDER1", new BigDecimal("12.34"), "SGD");
  }

  @ParameterizedTest
  @ValueSource(strings = {"merchant", "order", "currency", "amount", "transaction"})
  void invalidSuccessIdentityOrAmountCannotSettleAnOrder(String mismatch) {
    when(client.queryOrder("ORD-QUERY"))
        .thenReturn(new QueryOrderResult(
            true, 2,
            mismatch.equals("merchant") ? "other-merchant" : "merchant-test",
            mismatch.equals("order") ? "ORD-OTHER" : "ORD-QUERY",
            mismatch.equals("transaction") ? "" : "YP-123",
            mismatch.equals("amount") ? 1233L : 1234L,
            mismatch.equals("currency") ? "USD" : "SGD", "0", "trace"));

    assertThrows(IllegalArgumentException.class, () -> service.refresh(42L, "ORD-QUERY"));
    verify(persistence, never()).recordSuccessfulTransaction(any(), any(), any(), anyLong(), any());
    verify(persistence, never()).markPaymentAttemptSucceeded(any(), any());
    verifyNoInteractions(orderService);
  }

  @ParameterizedTest
  @CsvSource({"pending,pending", "unknown,unknown", "unavailable,unavailable", "paid,unknown", "failed,unknown"})
  void recentQueryCacheCannotBypassCommittedAttemptState(String cached, String expected) {
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(attempt(0, cached, LocalDateTime.now(ZoneOffset.UTC).minusSeconds(2))));
    assertEquals(new PaymentStatusResponse(expected, false), service.refresh(42L, "ORD-QUERY"));
    verifyNoInteractions(client, orderService);
  }

  @Test
  void inFlightCheckoutCreationDoesNotQueryAnOlderProviderOrder() {
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(new PaymentAttempt(
            "ORD-QUERY", "yeahpay", "visa", 0, null, null, null,
            LocalDateTime.now(ZoneOffset.UTC).minusSeconds(30))));
    assertEquals(new PaymentStatusResponse("pending", false), service.refresh(42L, "ORD-QUERY"));
    verifyNoInteractions(client, orderService);
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
  }

  @Test
  void unresolvedCreationMayBeQueriedAfterGraceButNotFoundRemainsLocked() {
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(new PaymentAttempt(
            "ORD-QUERY", "yeahpay", "visa", 0, null, null, null,
            LocalDateTime.now(ZoneOffset.UTC).minusSeconds(61))));
    when(client.queryOrder("ORD-QUERY"))
        .thenReturn(new QueryOrderResult(false, null, null, null, null, null, null, "10012", "trace"));
    assertEquals(new PaymentStatusResponse("unknown", false), service.refresh(42L, "ORD-QUERY"));
    verify(client).queryOrder("ORD-QUERY");
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
  }

  @Test
  void knownFailedAttemptCanRetryWithoutAnotherProviderQuery() {
    when(persistence.findAttemptForUpdate("ORD-QUERY"))
        .thenReturn(Optional.of(attempt(2, "failed", null)));
    assertTrue(service.refresh(42L, "ORD-QUERY").retryAllowed());
    verifyNoInteractions(client, orderService);
  }

  @Test
  void unconfiguredProviderIsUnavailableAndKeepsAttemptLocked() {
    when(client.isConfigured()).thenReturn(false);
    assertEquals(
        new PaymentStatusResponse("unavailable", false), service.refresh(42L, "ORD-QUERY"));
    verify(client, never()).queryOrder(any());
    verify(persistence).recordQueryResult("ORD-QUERY", "unavailable", "NOT_CONFIGURED", null);
  }

  @Test
  void providerFailureRecordsDiagnosticWithoutUnlockingPayment() {
    when(client.queryOrder("ORD-QUERY")).thenThrow(new IllegalStateException("network unavailable"));
    assertEquals(
        new PaymentStatusResponse("unavailable", false), service.refresh(42L, "ORD-QUERY"));
    verify(persistence).recordQueryResult("ORD-QUERY", "unavailable", "QUERY_ERROR", null);
    verify(persistence, never()).markPaymentAttemptFailed(any(), any());
    verifyNoInteractions(orderService);
  }

  @Test
  void settlementFailureEscapesForTransactionRollback() {
    when(client.queryOrder("ORD-QUERY")).thenReturn(query(2));
    doThrow(new IllegalStateException("database failure"))
        .when(orderService).markPaidByGateway(any(), any(), any(), any(), any(), any());
    assertThrows(IllegalStateException.class, () -> service.refresh(42L, "ORD-QUERY"));
    verify(persistence, never()).recordQueryResult("ORD-QUERY", "paid", "0", "trace");
    verify(persistence, never()).recordQueryResult("ORD-QUERY", "unavailable", "QUERY_ERROR", null);
  }

  private static PaymentAttempt attempt(int status, String queryStatus, LocalDateTime lastCheckedAt) {
    return new PaymentAttempt(
        "ORD-QUERY", "yeahpay", "visa", status, "https://payment.yeahpay.net/checkout/test",
        queryStatus, lastCheckedAt, LocalDateTime.now(ZoneOffset.UTC).minusMinutes(5));
  }

  private static QueryOrderResult query(int status) {
    return new QueryOrderResult(
        true, status, "merchant-test", "ORD-QUERY", "YP-123", 1234L, "SGD", "0", "trace");
  }
}
