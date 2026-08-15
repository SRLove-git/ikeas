"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SiteImage } from "@/components/SiteImage"
import { useAuth } from "@/lib/auth"
import { apiJson, type Cart } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"

const DELIVERY_FEE = 9.9

function QuantityField({
  productId,
  value,
  disabled,
  onCommit,
}: {
  productId: string
  value: number
  disabled: boolean
  onCommit: (productId: string, quantity: number) => void
}) {
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    setDraft(String(value))
  }, [value])

  const commit = () => {
    const parsed = Number.parseInt(draft, 10)
    const next = Number.isNaN(parsed) ? value : Math.max(1, Math.min(99, parsed))
    setDraft(String(next))
    if (next !== value) onCommit(productId, next)
  }

  return (
    <input
      id={`cart-quantity-${productId}`}
      aria-label="数量"
      type="number"
      pattern="\d*"
      min="1"
      max="99"
      step="1"
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      className="w-10 border-0 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:cursor-not-allowed disabled:opacity-40"
    />
  )
}

export function CartPage() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (ready && !user) {
      router.replace("/cn/zh/profile/login/")
      return
    }
    if (!ready || !user) return

    let cancelled = false
    const loadCart = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiJson<Cart>("/cart")
        if (!cancelled) {
          setCart(data)
          window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: data.totalQuantity }))
        }
      } catch (ex) {
        if (!cancelled) setError(ex instanceof Error ? ex.message : "加载购物袋失败")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCart()
    return () => {
      cancelled = true
    }
  }, [ready, user, router])

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = subtotal + DELIVERY_FEE

  const updateQuantity = async (productId: string, quantity: number) => {
    setUpdatingId(productId)
    setError(null)
    try {
      const data = await apiJson<Cart>(`/cart/items/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      })
      setCart(data)
      window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: data.totalQuantity }))
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "更新购物袋失败")
    } finally {
      setUpdatingId(null)
    }
  }

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        正在进入购物袋…
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <span className="text-ikea-black">购物袋</span>
        </nav>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">购物袋({totalQuantity})</h1>
          <p className="text-sm text-ikea-muted">确认商品后进入结算</p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section>
            {loading ? (
              <p className="py-12 text-center text-sm text-ikea-muted">加载购物袋…</p>
            ) : error ? (
              <p className="py-12 text-center text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-ikea-muted">购物袋还是空的</p>
                <Link href="/cn/zh/all-products/" className="i-pill i-pill--small mt-6">
                  去挑选商品
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(({ productId, product, quantity }) => (
                  <div
                    key={productId}
                    className="flex gap-4 border border-ikea-gray-200 bg-white p-5"
                  >
                    <Link href={`/cn/zh/p/${product.slug}/`} className="w-28 shrink-0">
                      <SiteImage
                        src={product.image}
                        alt={product.name}
                        className="aspect-square w-full bg-white p-2"
                        imgClassName="h-full w-full object-contain object-center"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/cn/zh/p/${product.slug}/`}
                        className="line-clamp-2 text-sm font-bold leading-5 hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-xs text-ikea-muted">
                        {product.productType || "商品"}
                      </p>
                      <p className="mt-2 text-sm text-ikea-muted">
                        单价 {formatPrice(product.price)}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                        <div className="flex items-center border border-ikea-gray-200">
                          <button
                            type="button"
                            aria-label="减少数量"
                            disabled={updatingId === productId || quantity <= 1}
                            onClick={() => void updateQuantity(productId, quantity - 1)}
                            className="px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            -
                          </button>
                          <QuantityField
                            productId={productId}
                            value={quantity}
                            disabled={updatingId === productId}
                            onCommit={(id, qty) => void updateQuantity(id, qty)}
                          />
                          <button
                            type="button"
                            aria-label="增加数量"
                            disabled={updatingId === productId || quantity >= 99}
                            onClick={() => void updateQuantity(productId, quantity + 1)}
                            className="px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {formatPrice((product.price ?? 0) * quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => void updateQuantity(productId, 0)}
                            className="mt-1 text-xs font-bold text-ikea-blue hover:underline"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="h-fit border border-ikea-gray-200 bg-white p-6">
            <h2 className="text-base font-bold">订单摘要</h2>

            {items.length > 0 ? (
              <>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ikea-muted">商品小计</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ikea-muted">配送费</span>
                    <span>{formatPrice(DELIVERY_FEE)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ikea-gray-200 pt-3 text-base font-bold">
                    <span>合计</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <Link
                  href="/cn/zh/checkout/"
                  className="i-btn i-btn--primary mt-6 flex h-11 w-full items-center justify-center text-sm font-bold text-white"
                >
                  去结算
                </Link>
                <p className="mt-3 text-center text-xs text-ikea-muted">含税，不含配送费</p>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
