"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { SiteImage } from "@/components/SiteImage"
import { useAuth } from "@/lib/auth"
import { apiJson, type OrderResponse } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"

function statusClassName(status: number): string {
  if (status === 1) return "bg-amber-100 text-amber-700"
  if (status === 2 || status === 3) return "bg-blue-100 text-blue-700"
  if (status === 4) return "bg-green-100 text-green-700"
  return "bg-ikea-gray-100 text-ikea-muted"
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-CN", { hour12: false })
}

export function MyOrdersPanel() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const [orders, setOrders] = useState<OrderResponse[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState(0)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJson<OrderResponse[]>("/orders")
      setOrders(data)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "加载订单失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const created = params.get("created")
    if (created) {
      setNotice(`订单 ${created} 已提交成功`)
      params.delete("created")
      const next = `${window.location.pathname}${params.size > 0 ? `?${params.toString()}` : ""}`
      window.history.replaceState({}, "", next)
    }
  }, [])

  useEffect(() => {
    if (ready && !user) {
      router.replace("/cn/zh/profile/login/")
      return
    }
    if (ready && user) {
      void loadOrders()
    }
  }, [ready, user, router, loadOrders])

  const cancelOrder = async (orderNo: string) => {
    setCancelling(orderNo)
    setError(null)
    try {
      await apiJson(`/orders/${orderNo}/cancel`, { method: "POST" })
      await loadOrders()
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "取消订单失败")
    } finally {
      setCancelling(null)
    }
  }

  const filteredOrders =
    orders?.filter((order) => filterStatus === 0 || order.status === filterStatus) ?? []

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        正在加载订单…
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <Link href="/cn/zh/profile/" className="hover:text-ikea-black">
            我的个人档案
          </Link>
          <span>/</span>
          <span className="text-ikea-black">我的订单</span>
        </nav>

        <h1 className="text-2xl font-bold leading-9">我的订单</h1>

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
              [0, "全部"],
              [1, "待付款"],
              [2, "待发货"],
              [3, "待收货"],
              [4, "已完成"],
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
            <div className="py-16 text-center text-sm text-ikea-muted">加载订单中…</div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-wrapper flex items-center justify-center bg-white py-20">
              <p className="text-sm text-ikea-muted">还没有相关订单</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <section key={order.orderNo} className="bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ikea-gray-200 px-6 py-4">
                    <div className="text-sm">
                      <span className="font-bold">订单号 {order.orderNo}</span>
                      <span className="ml-3 text-ikea-muted">{formatDate(order.createdAt)}</span>
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

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ikea-gray-200 px-6 py-4">
                    <div className="text-sm text-ikea-muted">
                      共 {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件商品，
                      <span className="ml-1 font-bold text-ikea-black">
                        实付 {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === 1 ? (
                        <button
                          type="button"
                          disabled={cancelling === order.orderNo}
                          onClick={() => void cancelOrder(order.orderNo)}
                          className="text-xs font-bold text-ikea-blue hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelling === order.orderNo ? "取消中…" : "取消订单"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
