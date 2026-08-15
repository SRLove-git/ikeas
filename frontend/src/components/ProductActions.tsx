"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiJson, getToken, type Cart } from "@/lib/api"
import { HeartIcon } from "@/components/icons"

export function ProductActions({ productId }: { productId: string }) {
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
      router.push("/cn/zh/profile/login/")
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
      setMessage("已加入购物袋")
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : "加入购物袋失败")
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
      setMessage(next ? "已加入收藏" : "已取消收藏")
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : "操作失败")
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button
        type="button"
        onClick={addToBag}
        disabled={bagState === "loading"}
        className="i-btn i-btn--small i-btn--primary h-11 px-8 text-sm disabled:opacity-60"
      >
        <span className="i-btn__inner">
          <span className="i-btn__label">
            {bagState === "loading"
              ? "请稍候…"
              : bagState === "added"
                ? "已加入购物袋"
                : "加入购物袋"}
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
            <span>{favState === "on" ? "已收藏" : "加入收藏"}</span>
          </span>
        </span>
      </button>
      {message ? <p className="text-sm text-ikea-blue">{message}</p> : null}
    </div>
  )
}
