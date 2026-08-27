"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { SiteImage } from "@/components/SiteImage"
import { useAuth } from "@/lib/auth"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { apiJson, type Cart } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"
import { readLocalCart, updateLocalQuantity } from "@/lib/local-cart"

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
  const { t } = useTranslation()
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
      aria-label={t("cartPage.quantityAria")}
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
  const { t } = useTranslation()
  const { user, ready } = useAuth()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return

    let cancelled = false
    const loadCart = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!user) {
          const local = readLocalCart()
          if (!cancelled) {
            setCart({
              items: local,
              totalQuantity: local.reduce((sum, item) => sum + item.quantity, 0),
              totalPrice: local.reduce(
                (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
                0,
              ),
            })
            window.dispatchEvent(
              new CustomEvent("ikea:cart-changed", {
                detail: local.reduce((sum, item) => sum + item.quantity, 0),
              }),
            )
          }
          return
        }
        const data = await apiJson<Cart>("/cart")
        if (!cancelled) {
          setCart(data)
          window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: data.totalQuantity }))
        }
      } catch (ex) {
        if (!cancelled) setError(ex instanceof Error ? ex.message : t("cart.loadFailed"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadCart()
    return () => {
      cancelled = true
    }
  }, [ready, user, t])

  const items = cart?.items ?? []
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = subtotal + DELIVERY_FEE

  const updateQuantity = async (productId: string, quantity: number) => {
    setUpdatingId(productId)
    setError(null)
    try {
      if (!user) {
        const local = updateLocalQuantity(productId, quantity)
        setCart({
          items: local,
          totalQuantity: local.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: local.reduce(
            (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
            0,
          ),
        })
        return
      }
      const data = await apiJson<Cart>(`/cart/items/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      })
      setCart(data)
      window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: data.totalQuantity }))
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("cartPage.updateFailed"))
    } finally {
      setUpdatingId(null)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("cartPage.entering")}
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("cartPage.breadcrumb")} />

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">
            {t("cartPage.title", { count: totalQuantity })}
          </h1>
          <div className="text-right">
            <p className="text-sm text-ikea-muted">{t("cartPage.hint")}</p>
            {!user ? (
              <p className="mt-1 text-xs text-ikea-muted">
                {t("cartPage.guestHint")}{" "}
                <Link href="/cn/zh/profile/login/" className="font-bold text-ikea-blue hover:underline">
                  {t("cartPage.guestLogin")}
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section>
            {loading ? (
              <p className="py-12 text-center text-sm text-ikea-muted">{t("cart.loading")}</p>
            ) : error ? (
              <p className="py-12 text-center text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-ikea-muted">{t("cartPage.empty")}</p>
                <Link href="/cn/zh/all-products/" className="i-pill i-pill--small mt-6">
                  {t("cartPage.browseProducts")}
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
                        {product.productType || t("cart.productTypeFallback")}
                      </p>
                      <p className="mt-2 text-sm text-ikea-muted">
                        {t("cartPage.unitPrice", { price: formatPrice(product.price) })}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                        <div className="flex items-center border border-ikea-gray-200">
                          <button
                            type="button"
                            aria-label={t("cartPage.decrease")}
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
                            aria-label={t("cartPage.increase")}
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
                            {t("cartPage.remove")}
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
            <h2 className="text-base font-bold">{t("checkout.orderSummary")}</h2>

            {items.length > 0 ? (
              <>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ikea-muted">{t("checkout.subtotal")}</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ikea-muted">{t("checkout.deliveryFee")}</span>
                    <span>{formatPrice(DELIVERY_FEE)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ikea-gray-200 pt-3 text-base font-bold">
                    <span>{t("checkout.total")}</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                <Link
                  href="/cn/zh/checkout/"
                  className="i-btn i-btn--primary mt-6 flex h-11 w-full items-center justify-center text-sm font-bold text-white"
                >
                  {t("cartPage.checkoutNow", { count: totalQuantity })}
                </Link>
                <p className="mt-3 text-center text-xs text-ikea-muted">{t("cartPage.taxNote")}</p>
              </>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  )
}
