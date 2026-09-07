"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { SiteImage } from "@/components/SiteImage"
import { useAuth } from "@/lib/auth"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import {
  apiJson,
  type CreatePaymentResponse,
  type OrderFulfillmentView,
  type OrderResponse,
} from "@/lib/api"
import { API_BASE } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"
import { useLocale } from "@/i18n/LanguageProvider"

function statusClassName(status: number): string {
  if (status === 1) return "bg-amber-100 text-amber-700"
  if (status === 2 || status === 3) return "bg-blue-100 text-blue-700"
  if (status === 4) return "bg-green-100 text-green-700"
  if (status === 6) return "bg-orange-100 text-orange-700"
  if (status === 7) return "bg-red-100 text-red-700"
  return "bg-ikea-gray-100 text-ikea-muted"
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale === "en" ? "en-SG" : "zh-CN", { hour12: false })
}

export function MyOrdersPanel() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const router = useRouter()
  const { user, ready } = useAuth()
  const [orders, setOrders] = useState<OrderResponse[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [paying, setPaying] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState(0)
  const [fulfillments, setFulfillments] = useState<Record<string, OrderFulfillmentView | null>>({})
  const [invoiceSubmitting, setInvoiceSubmitting] = useState<string | null>(null)
  const [afterSaleForm, setAfterSaleForm] = useState<string | null>(null)
  const [afterSaleType, setAfterSaleType] = useState(1)
  const [afterSaleReason, setAfterSaleReason] = useState("")
  const [afterSaleSubmitting, setAfterSaleSubmitting] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJson<OrderResponse[]>("/orders")
      setOrders(data)
      const next: Record<string, OrderFulfillmentView | null> = {}
      await Promise.all(
        data.map(async (order) => {
          try {
            next[order.orderNo] = await apiJson<OrderFulfillmentView>(
              `/orders/${order.orderNo}/fulfillment`,
            )
          } catch {
            next[order.orderNo] = null
          }
        }),
      )
      setFulfillments(next)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("orders.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const created = params.get("created")
    const payment = params.get("payment")
    if (created) {
      setNotice(t("orders.createdNotice", { no: created }))
      params.delete("created")
    }
    if (payment === "success") {
      setNotice("支付成功，订单状态将自动更新")
      params.delete("payment")
      params.delete("orderNo")
    }
    if (created || payment === "success") {
      const next = `${window.location.pathname}${params.size > 0 ? `?${params.toString()}` : ""}`
      window.history.replaceState({}, "", next)
    }
  }, [t])

  useEffect(() => {
    if (ready && !user) {
      router.replace("/zh/profile/login/")
      return
    }
    if (ready && user) {
      void loadOrders()
    }
  }, [ready, user, router, loadOrders, t])

  const cancelOrder = async (orderNo: string) => {
    setCancelling(orderNo)
    setError(null)
    try {
      await apiJson(`/orders/${orderNo}/cancel`, { method: "POST" })
      await loadOrders()
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("orders.cancelFailed"))
    } finally {
      setCancelling(null)
    }
  }

  const payOrder = async (orderNo: string) => {
    setPaying(orderNo)
    setError(null)
    try {
      const payment = await apiJson<CreatePaymentResponse>(
        `/payment/orders/${orderNo}?channel=card`,
        { method: "POST" },
      )
      if (payment.mockOnly) {
        await apiJson(`/orders/${orderNo}/pay`, { method: "POST" })
        await loadOrders()
        return
      }
      if (payment.payUrl) {
        window.location.href = payment.payUrl
        return
      }
      throw new Error("支付地址为空")
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("orders.payFailed"))
    } finally {
      setPaying(null)
    }
  }

  const requestInvoice = async (orderNo: string, kind: 1 | 2) => {
    const companyName = kind === 2 ? window.prompt("公司名称（发票抬头）") ?? "" : ""
    const taxNumber = kind === 2 ? window.prompt("税号 / UEN（如无请留空）") ?? "" : ""
    const email = window.prompt("接收邮箱") ?? ""
    setInvoiceSubmitting(orderNo)
    setError(null)
    try {
      await apiJson("/invoices", {
        method: "POST",
        body: JSON.stringify({
          orderNo,
          kind,
          companyName,
          taxNumber,
          email,
        }),
      })
      await loadOrders()
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "申请单据失败")
    } finally {
      setInvoiceSubmitting(null)
    }
  }

  const submitAfterSale = async (orderNo: string) => {
    setAfterSaleSubmitting(true)
    setError(null)
    try {
      await apiJson("/after-sales", {
        method: "POST",
        body: JSON.stringify({
          orderNo,
          type: afterSaleType,
          reason: afterSaleReason,
        }),
      })
      setAfterSaleForm(null)
      setAfterSaleReason("")
      setAfterSaleType(1)
      await loadOrders()
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "申请售后失败")
    } finally {
      setAfterSaleSubmitting(false)
    }
  }

  const filteredOrders =
    orders?.filter((order) => filterStatus === 0 || order.status === filterStatus) ?? []

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("orders.loadingPage")}
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("orders.title")} />

        <h1 className="text-2xl font-bold leading-9">{t("orders.title")}</h1>

        {notice ? (
          <div className="mt-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex border-b border-ikea-gray-200">
          {(
            [
              [0, t("orders.filterAll")],
              [1, t("orders.filterPendingPayment")],
              [2, t("orders.filterToShip")],
              [3, t("orders.filterToReceive")],
              [4, t("orders.filterCompleted")],
              [6, t("orders.filterRefunding")],
              [7, t("orders.filterRefundRejected")],
            ] as [number, string][]
          ).map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setFilterStatus(code)}
              className={`-mb-px border-b-2 px-5 py-3 text-center text-sm font-bold transition-colors ${
                filterStatus === code
                  ? "border-ikea-blue text-ikea-black"
                  : "border-transparent text-ikea-muted hover:text-ikea-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-16 text-center text-sm text-ikea-muted">{t("orders.loading")}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-wrapper flex items-center justify-center bg-white py-20">
              <p className="text-sm text-ikea-muted">{t("orders.empty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <section key={order.orderNo} className="bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ikea-gray-200 px-6 py-4">
                    <div className="text-sm">
                      <span className="font-bold">
                        {t("orders.orderNo", { no: order.orderNo })}
                      </span>
                      <span className="ml-3 text-ikea-muted">
                        {formatDate(order.createdAt, locale)}
                      </span>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${statusClassName(order.status)}`}
                    >
                      {order.statusLabel}
                    </span>
                  </div>

                  <div className="divide-y divide-ikea-gray-100">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-4 px-6 py-4">
                        <SiteImage
                          src={item.image}
                          alt={item.productName}
                          className="h-20 w-20 shrink-0 bg-white"
                          imgClassName="h-full w-full object-contain object-center"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold">{item.productName}</p>
                          <p className="mt-1 text-xs text-ikea-muted">
                            {formatPrice(item.unitPrice)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-bold">{formatPrice(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>

                  {(() => {
                    const fulfillment = fulfillments[order.orderNo]
                    const logistics = fulfillment?.logistics
                    const invoice = fulfillment?.latestInvoice
                    const afterSale = fulfillment?.afterSale
                    return (
                      <div className="space-y-3 border-t border-ikea-gray-100 px-6 py-4">
                        {logistics ? (
                          <div className="rounded bg-ikea-gray-50 p-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold">
                                物流：{logistics.carrier ?? "-"} {logistics.trackingNo ?? ""}
                              </span>
                              <span className="text-ikea-muted">{logistics.status ?? ""}</span>
                            </div>
                            {logistics.traces.length > 0 ? (
                              <ul className="mt-2 space-y-1 text-ikea-muted">
                                {logistics.traces.slice(-4).map((trace, index) => (
                                  <li key={`${trace}-${index}`}>{trace}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}

                        {afterSale ? (
                          <div className="rounded bg-amber-50 p-3 text-xs">
                            售后申请：{afterSale.omsReturnNo ?? `#${afterSale.id}`} · 状态{" "}
                            {afterSale.status}
                          </div>
                        ) : null}

                        {invoice ? (
                          <div className="text-xs">
                            已申请{invoice.kind === 2 ? "发票" : "收据"}：
                            {invoice.fileUrl ? (
                              <a
                                href={`${API_BASE}${invoice.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-ikea-blue hover:underline"
                              >
                                下载
                              </a>
                            ) : (
                              <span className="text-ikea-muted">处理中</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )
                  })()}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ikea-gray-200 px-6 py-4">
                    <div className="text-sm text-ikea-muted">
                      {t("orders.itemsCount", {
                        count: order.items.reduce((sum, item) => sum + item.quantity, 0),
                      })}
                      <span className="ml-1 font-bold text-ikea-black">
                        {t("orders.paid", { amount: formatPrice(order.totalAmount) })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === 1 ? (
                        <>
                          <button
                            type="button"
                            disabled={paying === order.orderNo || cancelling === order.orderNo}
                            onClick={() => void payOrder(order.orderNo)}
                            className="rounded bg-ikea-blue px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {paying === order.orderNo
                              ? t("orders.paying")
                              : "去支付"}
                          </button>
                          <button
                            type="button"
                            disabled={cancelling === order.orderNo || paying === order.orderNo}
                            onClick={() => void cancelOrder(order.orderNo)}
                            className="text-xs font-bold text-ikea-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancelling === order.orderNo
                              ? t("orders.cancelling")
                              : t("orders.cancelOrder")}
                          </button>
                        </>
                      ) : null}

                      {order.status === 2 || order.status === 3 || order.status === 4 ? (
                        <>
                          <button
                            type="button"
                            disabled={invoiceSubmitting === order.orderNo}
                            onClick={() => void requestInvoice(order.orderNo, 1)}
                            className="text-xs font-bold text-ikea-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            申请收据
                          </button>
                          <button
                            type="button"
                            disabled={invoiceSubmitting === order.orderNo}
                            onClick={() => void requestInvoice(order.orderNo, 2)}
                            className="text-xs font-bold text-ikea-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            申请发票
                          </button>
                          {fulfillments[order.orderNo]?.afterSale ? null : (
                            <button
                              type="button"
                              disabled={afterSaleSubmitting}
                              onClick={() => setAfterSaleForm(order.orderNo)}
                              className="text-xs font-bold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              申请售后
                            </button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>

                  {afterSaleForm === order.orderNo ? (
                    <div className="border-t border-ikea-gray-200 bg-ikea-gray-50 px-6 py-4">
                      <label className="text-xs font-bold">售后类型</label>
                      <select
                        value={afterSaleType}
                        onChange={(event) => setAfterSaleType(Number(event.target.value))}
                        className="mt-2 h-10 w-full border border-ikea-gray-200 bg-white px-3 text-sm outline-none"
                      >
                        <option value={1}>仅退款</option>
                        <option value={2}>退货退款</option>
                        <option value={3}>换货</option>
                        <option value={4}>维修</option>
                      </select>
                      <textarea
                        value={afterSaleReason}
                        onChange={(event) => setAfterSaleReason(event.target.value)}
                        placeholder="请描述售后原因"
                        className="mt-2 min-h-20 w-full border border-ikea-gray-200 bg-white px-3 py-2 text-sm outline-none"
                      />
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          disabled={afterSaleSubmitting}
                          onClick={() => void submitAfterSale(order.orderNo)}
                          className="rounded bg-ikea-blue px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                        >
                          提交申请
                        </button>
                        <button
                          type="button"
                          onClick={() => setAfterSaleForm(null)}
                          className="text-xs font-bold text-ikea-muted hover:underline"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
