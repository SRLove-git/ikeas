"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { apiJson, getToken, type Cart, type Product } from "@/lib/api"
import { HeartIcon } from "@/components/icons"
import { addLocalItem } from "@/lib/local-cart"
import type { CatalogProduct } from "@/data/catalog"

export function ProductActions({
  productId,
  product,
}: {
  productId: string
  product: Pick<CatalogProduct, "slug" | "name" | "price" | "image"> & {
    productType?: string | null
  }
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [bagState, setBagState] = useState<"idle" | "loading" | "added">("idle")
  const [favState, setFavState] = useState<"on" | "off">("off")
  const [message, setMessage] = useState<string | null>(null)

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
    if (!getToken()) {
      const snapshot: Product = {
        id: productId,
        slug: product.slug,
        name: product.name,
        productType: product.productType ?? null,
        price: product.price,
        image: product.image,
        labels: [],
      }
      addLocalItem({ productId, quantity: 1, product: snapshot })
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
      router.push("/cn/zh/profile/login/")
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

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row" data-avoid-floating>
      <button
        type="button"
        onClick={addToBag}
        disabled={bagState === "loading"}
        className="i-btn i-btn--small i-btn--primary h-11 px-8 text-sm disabled:opacity-60"
      >
        <span className="i-btn__inner">
          <span className="i-btn__label">
            {bagState === "loading"
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
      {message ? <p className="text-sm text-ikea-blue">{message}</p> : null}
    </div>
  )
}
