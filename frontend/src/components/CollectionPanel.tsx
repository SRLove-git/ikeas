"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { apiJson, type Product } from "@/lib/api"
import { SiteImage } from "@/components/SiteImage"
import { formatPrice } from "@/lib/catalog-format"
import { HeartIcon } from "@/components/icons"

type CollectionTab = "products" | "inspiration" | "wishlist"

export function CollectionPanel() {
  const { user, ready } = useAuth()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CollectionTab>("products")

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJson<{ items: Product[] }>("/favorites")
      setItems(data.items)
      setError(null)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "加载收藏失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ready || !user) return

    const timer = window.setTimeout(() => void loadFavorites(), 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadFavorites, ready, user])

  const removeFavorite = async (productId: string) => {
    setError(null)
    try {
      const data = await apiJson<{ items: Product[] }>(`/favorites/${productId}`, {
        method: "DELETE",
      })
      setItems(data.items)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "取消收藏失败")
    }
  }

  const renderEmptyState = (text: string, actionLabel: string, href?: string) => (
    <div className="flex flex-col items-center py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/collection-empty.svg" alt="" className="h-32 w-32" />
      <p className="mt-6 text-sm text-ikea-muted">{text}</p>
      {href ? (
        <Link href={href} className="i-btn i-btn--small i-btn--primary mt-6">
          <span className="i-btn__inner">
            <span className="i-btn__label">{actionLabel}</span>
          </span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setError("心愿单功能暂未开放")}
          className="i-btn i-btn--small i-btn--primary mt-6"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label">{actionLabel}</span>
          </span>
        </button>
      )}
    </div>
  )

  if (!ready) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        加载中…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="font-ikea flex min-h-[60vh] flex-col items-center justify-center bg-white px-5 py-10 text-center text-ikea-black">
        <h1 className="text-4xl font-bold leading-[1.4]">登录 BUZUD 账户</h1>
        <p className="mt-8 text-base">查看收藏中的内容</p>
        <Link
          href="/cn/zh/profile/login/"
          className="i-btn i-btn--primary mt-8 h-12 px-8 text-sm font-bold text-white"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label">登录 / 注册</span>
          </span>
        </Link>
        <div className="mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/collection-login.svg"
            alt=""
            className="mx-auto w-[280px] sm:w-[400px]"
          />
        </div>
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
          <Link href="/cn/zh/profile/" className="hover:text-ikea-black">
            我的个人档案
          </Link>
          <span>/</span>
          <span className="text-ikea-black">我的收藏</span>
        </nav>

        <h1 className="text-2xl font-bold leading-9">我的收藏({items.length})</h1>

        <div className="mt-6 flex border-b border-ikea-gray-200">
          {(
            [
              ["products", "商品"],
              ["inspiration", "家居灵感"],
              ["wishlist", "心愿单"],
            ] as [CollectionTab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`-mb-px flex-1 border-b-2 px-5 py-3 text-center text-sm font-bold transition-colors ${
                activeTab === key
                  ? "border-ikea-blue text-ikea-black"
                  : "border-transparent text-ikea-muted hover:text-ikea-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 rounded bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {activeTab === "inspiration" ? (
          renderEmptyState("您还没有收藏家居灵感", "去逛逛", "/cn/zh/all-products/")
        ) : activeTab === "wishlist" ? (
          renderEmptyState("您还没有创建心愿单", "新建心愿单")
        ) : loading ? (
          <p className="py-16 text-center text-sm text-ikea-muted">加载收藏中…</p>
        ) : items.length === 0 ? (
          renderEmptyState("您还没有收藏商品", "去逛逛", "/cn/zh/all-products/")
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <div key={product.id} className="group relative flex flex-col">
                <Link href={`/cn/zh/p/${product.slug}/`} className="block">
                  <SiteImage
                    src={product.image}
                    alt={product.name}
                    className="aspect-square w-full bg-white transition-transform duration-300 group-hover:scale-105"
                    imgClassName="h-full w-full object-contain object-center"
                  />
                </Link>
                <button
                  type="button"
                  aria-label="取消收藏"
                  onClick={() => void removeFavorite(product.id)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
                >
                  <HeartIcon className="h-4 w-4 text-ikea-red" />
                </button>
                <Link
                  href={`/cn/zh/p/${product.slug}/`}
                  className="mt-3 text-sm font-bold leading-5"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm">{formatPrice(product.price)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
