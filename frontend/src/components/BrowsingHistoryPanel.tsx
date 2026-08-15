"use client"

import { useState } from "react"
import Link from "next/link"
import { ProductCard } from "@/components/ProductCard"
import { SearchIcon } from "@/components/icons"
import type { CatalogProduct } from "@/data/catalog"

const BROWSING_HISTORY_KEY = "buzud_browsing_history"

export function BrowsingHistoryPanel({ products }: { products: CatalogProduct[] }) {
  const [productIds, setProductIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return []
    return JSON.parse(window.localStorage.getItem(BROWSING_HISTORY_KEY) ?? "[]") as string[]
  })

  const items = productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is CatalogProduct => Boolean(product))

  const clearHistory = () => {
    window.localStorage.removeItem(BROWSING_HISTORY_KEY)
    setProductIds([])
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
          <span className="text-ikea-black">我的足迹</span>
        </nav>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-9 lg:text-3xl">我的足迹</h1>
            <p className="mt-2 text-sm text-ikea-muted">最近浏览过的商品</p>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={clearHistory}
              className="text-sm font-bold text-ikea-blue hover:underline"
            >
              清空浏览记录
            </button>
          ) : null}
        </div>

        {items.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="i-empty-list__body mt-20 flex flex-col items-center text-center">
            <SearchIcon width={96} height={96} className="i-empty-list__img text-ikea-gray-200" />
            <p className="i-empty-list__content mt-4 text-sm text-ikea-muted">暂未留下足迹</p>
            <Link href="/cn/zh/all-products/" className="i-pill i-pill--small mt-6">
              去逛逛
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
