"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { apiJson, getToken, type Cart, type Product, type ProductAvailability } from "@/lib/api"
import { HeartIcon } from "@/components/icons"
import { addLocalItem } from "@/lib/local-cart"
import type { CatalogProduct } from "@/data/catalog"
import { formatPrice } from "@/lib/catalog-format"

export function ProductActions({
  productId,
  product,
}: {
  productId: string
  product: Pick<CatalogProduct, "slug" | "name" | "price" | "originalPrice" | "image"> & {
    productType?: string | null
  }
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [bagState, setBagState] = useState<"idle" | "loading" | "added">("idle")
  const [favState, setFavState] = useState<"on" | "off">("off")
  const [message, setMessage] = useState<string | null>(null)
  const [stockAlertLoading, setStockAlertLoading] = useState(false)
  const [availability, setAvailability] = useState<ProductAvailability | "checking" | "unknown">(
    "checking",
  )

  useEffect(() => {
    let cancelled = false
    setAvailability("checking")
    apiJson<ProductAvailability>(`/products/${encodeURIComponent(productId)}/availability`)
      .then((result) => {
        if (!cancelled) setAvailability(result)
      })
      .catch(() => {
        if (!cancelled) setAvailability("unknown")
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    if (!getToken()) {
      return
    }
    let cancelled = false
    apiJson<{ ids: string[] }>("/favorites")
      .then((data) => {
        if (!cancelled) {
          setFavState(data.ids.includes(productId) ? "on" : "off")
        }
      })
      .catch(() => {
        if (!cancelled) setFavState("off")
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  const addToBag = async () => {
    if (availability === "checking" || availability === "unknown" || !availability.sellable) {
      return
    }
    if (!getToken()) {
      const snapshot: Product = {
        id: productId,
        slug: product.slug,
        name: product.name,
        productType: product.productType ?? null,
        price: availability.price ?? product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        labels: [],
      }
      addLocalItem({
        productId,
        quantity: 1,
        product: snapshot,
        sellable: true,
        availabilityReason: "AVAILABLE",
      })
      setBagState("added")
      setMessage(t("product.addedToBag"))
      return
    }
    setBagState("loading")
    setMessage(null)
    try {
      await apiJson("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      const cart = await apiJson<Cart>("/cart")
      setBagState("added")
      window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: cart.totalQuantity }))
      setMessage(t("product.addedToBag"))
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : t("product.operationFailed"))
      setBagState("idle")
    }
  }

  const toggleFavorite = async () => {
    if (!getToken()) {
      router.push("/zh/profile/login/")
      return
    }
    setMessage(null)
    const next = favState !== "on"
    try {
      if (next) {
        await apiJson("/favorites", {
          method: "POST",
          body: JSON.stringify({ productId }),
        })
      } else {
        await apiJson(`/favorites/${productId}`, { method: "DELETE" })
      }
      setFavState(next ? "on" : "off")
      setMessage(next ? t("product.addedFavorite") : t("product.removedFavorite"))
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : t("product.operationFailed"))
    }
  }

  const registerStockAlert = async () => {
    if (!getToken()) {
      router.push("/zh/profile/login/")
      return
    }
    const contact = window.prompt(t("product.stockAlertContactPrompt")) ?? ""
    if (!contact.trim()) {
      setMessage(t("product.stockAlertContactRequired"))
      return
    }
    setStockAlertLoading(true)
    setMessage(null)
    try {
      await apiJson("/stock-alerts", {
        method: "POST",
        body: JSON.stringify({ productId, contact: contact.trim() }),
      })
      setMessage(t("product.stockAlertSuccess"))
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : t("product.stockAlertFailed"))
    } finally {
      setStockAlertLoading(false)
    }
  }

  const unavailableLabel =
    availability === "unknown"
      ? t("product.availabilityUnavailable")
      : availability !== "checking" && !availability.sellable
        ? availability.reason === "OUT_OF_STOCK"
          ? t("product.outOfStock")
          : availability.reason === "OMS_SKU_UNMAPPED"
            ? t("product.notReadyForSale")
            : availability.reason === "OMS_SNAPSHOT_UNAVAILABLE"
              ? t("product.availabilityUnavailable")
              : t("product.priceUnavailable")
        : null
  const addDisabled =
    bagState === "loading" ||
    availability === "checking" ||
    availability === "unknown" ||
    !availability.sellable
  const effectivePrice =
    availability !== "checking" && availability !== "unknown" && availability.price !== null
      ? availability.price
      : product.price
  const showOriginalPrice =
    product.originalPrice !== null &&
    product.originalPrice !== undefined &&
    effectivePrice !== null &&
    product.originalPrice > effectivePrice

  return (
    <div className="mt-6" data-avoid-floating>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold">{formatPrice(effectivePrice)}</span>
        {showOriginalPrice ? (
          <span className="text-base text-ikea-muted line-through">
            {formatPrice(product.originalPrice ?? null)}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={addToBag}
          disabled={addDisabled}
          className="i-btn i-btn--small i-btn--primary h-11 px-8 text-sm disabled:opacity-60"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label">
              {availability === "checking"
                ? t("product.checkingAvailability")
                : unavailableLabel
                  ? unavailableLabel
                  : bagState === "loading"
                    ? t("product.adding")
                    : bagState === "added"
                      ? t("product.addedToBag")
                      : t("product.addToBag")}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={toggleFavorite}
          className="i-btn i-btn--small i-btn--secondary h-11 px-8 text-sm"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label inline-flex items-center gap-2">
              <HeartIcon
                className={`h-4 w-4 ${favState === "on" ? "text-ikea-red" : "text-ikea-black"}`}
              />
              <span>{favState === "on" ? t("product.favorited") : t("product.addFavorite")}</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={registerStockAlert}
          disabled={stockAlertLoading}
          className="i-btn i-btn--small i-btn--secondary h-11 px-8 text-sm disabled:opacity-60"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label">
              {stockAlertLoading ? t("product.stockAlertRegistering") : t("product.stockAlert")}
            </span>
          </span>
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-ikea-blue">{message}</p> : null}
    </div>
  )
}
