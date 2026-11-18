import assert from "node:assert/strict"
import test from "node:test"

import {
  checkoutModeFor,
  isPaymentMethodId,
  PAYMENT_METHODS,
} from "../src/lib/payment-methods.ts"

test("only configured payment methods are accepted from the checkout URL", () => {
  for (const method of PAYMENT_METHODS) {
    assert.equal(isPaymentMethodId(method.id), true)
  }
  assert.equal(isPaymentMethodId("card"), false)
  assert.equal(isPaymentMethodId("mock"), false)
  assert.equal(isPaymentMethodId("javascript:alert(1)"), false)
  assert.equal(isPaymentMethodId(null), false)
})

test("PayNow always uses the QR presentation", () => {
  assert.equal(checkoutModeFor("paynow"), "qr")
})
