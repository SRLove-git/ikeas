"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { CartBagIcon } from "@/components/icons"
import type { FeedProduct } from "@/data/homepage"

interface ProductInspirationProps {
  title: string
  tabs: string[]
  products: Record<string, FeedProduct[]>
}

const PAGE_SIZE = 12

export function ProductInspiration({ title, tabs, products }: ProductInspirationProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState(tabs[0] ?? t("search.all"))
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const items = products[activeTab] ?? []
  const visible = items.slice(0, visibleCount)

  const loadMore = () => setVisibleCount((current) => current + PAGE_SIZE)

  return (
    <section className="inspiration-feeds m-x-5 md:m-x-0">
      <h2 className="inspiration-feeds__title">
        <strong>{title}</strong>
      </h2>
      <div className="inspiration-feeds__tabs sticky">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`i-pill i-pill--small i-tabs__item i-tabs__pill ${
                activeTab === tab ? "i-pill--active" : ""
              }`}
              onClick={() => {
                setActiveTab(tab)
                setVisibleCount(PAGE_SIZE)
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="i-waterfall">
        <div className="i-waterfall-container">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3" key={activeTab}>
            {visible.map((product) => (
              <ProductPinCard
                key={product.productId ?? `${product.left}-${product.top}`}
                product={product}
              />
            ))}
          </div>
        </div>
      </div>

      {visible.length < items.length ? (
        <div className="flex justify-center">
          <button
            type="button"
            className="i-btn i-btn--small i-btn--primary mt-4"
            onClick={loadMore}
          >
            <span className="i-btn__inner">
              <span className="i-btn__label">{t("home.loadMore")}</span>
            </span>
          </button>
        </div>
      ) : null}
    </section>
  )
}

function ProductPinCard({ product }: { product: FeedProduct }) {
  const { t } = useTranslation()
  const [showTooltip, setShowTooltip] = useState(false)

  const tagStyle = product.tagStyle
    ? Object.fromEntries(
        product.tagStyle
          .split(";")
          .map((pair) => pair.split(":").map((part) => part.trim()))
          .filter(([key, value]) => key && value)
          .map(([key, value]) => {
            const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
            return [camel, value]
          }),
      )
    : undefined

  return (
    <div
      className="i-waterfall-container__column__item group relative aspect-square overflow-visible"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link
        href={product.href ?? "#"}
        className="block h-full w-full"
        aria-label={product.title ?? t("common.product")}
      >
        <div className="i-aspect-ratio-box i-aspect-ratio-box--standard i-product-image-box h-full w-full overflow-visible">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.title ?? ""}
              className="i-object-contain h-full w-full object-contain object-center drop-shadow-[0_8px_16px_rgba(17,17,17,0.12)]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-ikea-gray-150/70" />
            </div>
          )}
        </div>
      </Link>

      <button
        type="button"
        aria-label={product.title ?? t("common.product")}
        className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ikea-black bg-white shadow-sm transition-transform hover:scale-125"
        style={{ left: product.left, top: product.top }}
        onClick={() => setShowTooltip((current) => !current)}
      />

      {showTooltip ? (
        <div
          className="absolute z-30 w-56 rounded-lg border border-ikea-gray-200 bg-white p-3 shadow-xl"
          style={
            product.tooltipPosition === "is-top"
              ? {
                  left: `clamp(0px, ${product.left}, calc(100% - 14rem))`,
                  bottom: `calc(100% - ${product.top} + 14px)`,
                }
              : {
                  left: `clamp(0px, ${product.left}, calc(100% - 14rem))`,
                  top: `calc(${product.top} + 16px)`,
                }
          }
        >
          {product.tags.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="i-product-tag inline-block px-1 py-0.5 text-[10px] font-bold leading-[10px]"
                  style={tagStyle ?? { backgroundColor: "#ca5008", color: "#ffffff" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <Link
            href={product.href ?? "#"}
            className="text-xs font-bold leading-[18px] text-ikea-black hover:underline"
          >
            {product.title}
          </Link>
          {product.desc ? (
            <p className="mt-0.5 text-xs leading-[18px] text-ikea-muted">{product.desc}</p>
          ) : null}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-ikea-black">{product.price}</span>
            <button
              type="button"
              className="i-btn i-btn--xsmall i-btn--icon-emphasised cartin-button flex h-8 w-8 items-center justify-center rounded-full bg-ikea-yellow text-ikea-black transition-colors hover:bg-ikea-yellow/85"
              aria-label={t("product.addToBag")}
            >
              <CartBagIcon width={20} height={20} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
