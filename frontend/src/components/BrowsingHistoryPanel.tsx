"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { ProductCard } from "@/components/ProductCard"
import { SearchIcon } from "@/components/icons"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import type { CatalogProduct } from "@/data/catalog"

const BROWSING_HISTORY_KEY = "buzud_browsing_history"

export function BrowsingHistoryPanel({ products }: { products: CatalogProduct[] }) {
  const { t } = useTranslation()
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
        <Breadcrumbs currentLabel={t("browsingHistory.title")} />

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-9 lg:text-3xl">
              {t("browsingHistory.title")}
            </h1>
            <p className="mt-2 text-sm text-ikea-muted">{t("browsingHistory.desc")}</p>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={clearHistory}
              className="text-sm font-bold text-ikea-blue hover:underline"
            >
              {t("browsingHistory.clear")}
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
            <p className="i-empty-list__content mt-4 text-sm text-ikea-muted">
              {t("browsingHistory.empty")}
            </p>
            <Link href="/cn/zh/all-products/" className="i-pill i-pill--small mt-6">
              {t("collection.browse")}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
