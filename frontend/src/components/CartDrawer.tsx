"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { SiteImage } from "@/components/SiteImage"
import { formatPrice } from "@/lib/catalog-format"
import { apiJson, getToken, type Cart, type CartItem } from "@/lib/api"

export function CartDrawer() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadCart = useCallback(async () => {
    if (!getToken()) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const cart = await apiJson<Cart>("/cart")
      setItems(cart.items)
      window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: cart.totalQuantity }))
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("cart.loadFailed"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    const handler = () => {
      setOpen(true)
      void loadCart()
    }
    window.addEventListener("ikea:open-cart", handler)
    return () => window.removeEventListener("ikea:open-cart", handler)
  }, [loadCart])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const changeQty = async (productId: string, delta: number) => {
    const current = items.find((item) => item.productId === productId)
    if (!current) return

    const next = Math.max(0, current.quantity + delta)
    setUpdatingId(productId)
    setError(null)
    try {
      const cart = await apiJson<Cart>(`/cart/items/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: next }),
      })
      setItems(cart.items)
      window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: cart.totalQuantity }))
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("cart.updateFailed"))
    } finally {
      setUpdatingId(null)
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={t("cart.closeAria")}
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ikea-gray-200 px-6 py-4">
          <h2 className="text-base font-bold">{t("cart.title", { count: totalQuantity })}</h2>
          <button
            type="button"
            aria-label={t("common.close")}
            className="flex h-8 w-8 items-center justify-center text-ikea-muted hover:text-ikea-black"
            onClick={() => setOpen(false)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="m12 10.6 6-6 1.4 1.4-6 6 6 6-1.4 1.4-6-6-6 6L4.6 18l6-6-6-6L6 4.6z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-ikea-muted">{t("cart.loading")}</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-ikea-muted">{t("cart.empty")}</p>
          ) : (
            items.map(({ productId, product, quantity }) => (
              <div key={productId} className="flex gap-4 border-b border-ikea-gray-100 py-4">
                <Link
                  href={`/cn/zh/p/${product.slug}/`}
                  className="w-24 shrink-0"
                  onClick={() => setOpen(false)}
                >
                  <SiteImage
                    src={product.image}
                    alt={product.name}
                    className="aspect-square w-full bg-white p-2"
                    imgClassName="h-full w-full object-contain object-center"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link
                    href={`/cn/zh/p/${product.slug}/`}
                    className="text-sm font-bold leading-5 hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    {product.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ikea-muted">
                    {product.productType || t("cart.productTypeFallback")}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="flex items-center border border-ikea-gray-200 text-xs">
                      <button
                        type="button"
                        className="px-2 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t("cart.decrease")}
                        disabled={updatingId === productId}
                        onClick={() => changeQty(productId, -1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{quantity}</span>
                      <button
                        type="button"
                        className="px-2 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={t("cart.increase")}
                        disabled={updatingId === productId}
                        onClick={() => changeQty(productId, 1)}
                      >
                        +
                      </button>
                    </span>
                    <span className="text-sm font-bold">
                      {formatPrice((product.price ?? 0) * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-ikea-gray-200 px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ikea-muted">{t("cart.subtotal")}</span>
            <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-ikea-muted">{t("cart.taxNote")}</p>
          <Link
            href="/cn/zh/checkout/"
            onClick={() => setOpen(false)}
            className="i-btn i-btn--primary mt-4 flex h-11 w-full items-center justify-center text-sm font-bold text-white"
          >
            {t("cart.checkout")}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 h-11 w-full text-sm font-bold text-ikea-blue hover:underline"
          >
            {t("cart.continueShopping")}
          </button>
        </div>
      </aside>
    </div>
  )
}
