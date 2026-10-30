import type { PaymentStatusResponse } from "./api"

/** Only a confirmed payment result may produce a success notice. */
export function paymentStatusView(
  result: PaymentStatusResponse,
  persistedOrderStatus?: number,
): {
  messageKey: string
  keepPolling: boolean
} {
  // A callback can settle the order between the channel query and the orders fetch.
  if (persistedOrderStatus !== undefined && [2, 3, 4].includes(persistedOrderStatus)) {
    return { messageKey: "orders.paymentConfirmed", keepPolling: false }
  }
  switch (result.status) {
    case "paid":
      return { messageKey: "orders.paymentConfirmed", keepPolling: false }
    case "failed":
    case "closed":
      return {
        messageKey: result.retryAllowed
          ? "orders.paymentRetryAvailable"
          : "orders.paymentNotCompleted",
        keepPolling: false,
      }
    case "not_started":
      return { messageKey: "orders.paymentNotStarted", keepPolling: false }
    case "unavailable":
      return { messageKey: "orders.paymentStatusUnavailable", keepPolling: true }
    case "pending":
      return { messageKey: "orders.paymentPending", keepPolling: true }
    default:
      return { messageKey: "orders.paymentStatusUnknown", keepPolling: true }
  }
}
