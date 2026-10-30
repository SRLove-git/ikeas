import assert from "node:assert/strict"
import test from "node:test"
import { paymentStatusView } from "../src/lib/payment-status.ts"

test("only paid produces the payment success notice", () => {
  for (const status of [
    "pending",
    "failed",
    "closed",
    "unknown",
    "not_started",
    "unavailable",
    "unexpected",
  ]) {
    for (const retryAllowed of [true, false]) {
      assert.notEqual(
        paymentStatusView({ status, retryAllowed }).messageKey,
        "orders.paymentConfirmed",
      )
    }
  }
  assert.deepEqual(paymentStatusView({ status: "paid", retryAllowed: false }), {
    messageKey: "orders.paymentConfirmed",
    keepPolling: false,
  })
})

test("an unknown result remains unconfirmed even when a response suggests a retry", () => {
  assert.deepEqual(paymentStatusView({ status: "unknown", retryAllowed: true }), {
    messageKey: "orders.paymentStatusUnknown",
    keepPolling: true,
  })
})

test("retry instructions require a terminal result and explicit server permission", () => {
  for (const status of ["failed", "closed"]) {
    assert.deepEqual(paymentStatusView({ status, retryAllowed: true }), {
      messageKey: "orders.paymentRetryAvailable",
      keepPolling: false,
    })
    assert.deepEqual(paymentStatusView({ status, retryAllowed: false }), {
      messageKey: "orders.paymentNotCompleted",
      keepPolling: false,
    })
  }
})

test("an unavailable channel can await a delayed callback without declaring failure", () => {
  assert.deepEqual(paymentStatusView({ status: "unavailable", retryAllowed: false }), {
    messageKey: "orders.paymentStatusUnavailable",
    keepPolling: true,
  })
})

test("a stored paid order confirms a callback that arrived after the query", () => {
  for (const status of [2, 3, 4]) {
    assert.deepEqual(paymentStatusView({ status: "unavailable", retryAllowed: false }, status), {
      messageKey: "orders.paymentConfirmed",
      keepPolling: false,
    })
  }
  for (const status of [1, 5, 6, 7]) {
    assert.notEqual(
      paymentStatusView({ status: "unknown", retryAllowed: false }, status).messageKey,
      "orders.paymentConfirmed",
    )
  }
})
