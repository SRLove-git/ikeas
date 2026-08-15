"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { apiJson, type Product } from "@/lib/api"
import {
  addToWishlist,
  createWishlist,
  deleteWishlist,
  getSavedInspirationIds,
  getWishlists,
  removeFromWishlist,
  renameWishlist,
  toggleSavedInspiration,
  type Wishlist,
} from "@/lib/collection-store"
import { SiteImage } from "@/components/SiteImage"
import { formatPrice } from "@/lib/catalog-format"
import { HeartIcon } from "@/components/icons"
import type { PromoTile } from "@/types"
import type { ProductData } from "@/data/pages-types"

type CollectionTab = "products" | "inspiration" | "wishlist"

interface CollectionPanelProps {
  inspirationItems: PromoTile[]
  catalogProducts: ProductData[]
}

function inspirationKey(item: PromoTile): string {
  return item.ctaHref ?? item.href ?? item.title
}

export function CollectionPanel({ inspirationItems, catalogProducts }: CollectionPanelProps) {
  const { user, ready } = useAuth()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CollectionTab>("products")
  const [inspirationIds, setInspirationIds] = useState<string[]>([])
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [wishlistTargetId, setWishlistTargetId] = useState<string | null>(null)
  const [isCreatingWishlist, setIsCreatingWishlist] = useState(false)
  const [wishlistName, setWishlistName] = useState("")

  const loadFavorites = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiJson<{ items: Product[] }>("/favorites")
      setItems(data.items)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "加载收藏失败")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setInspirationIds(getSavedInspirationIds())
    setWishlists(getWishlists())
  }, [])

  useEffect(() => {
    if (!ready || !user) return
    const timer = window.setTimeout(() => void loadFavorites(), 0)
    return () => {
      window.clearTimeout(timer)
    }
  }, [loadFavorites, ready, user])

  useEffect(() => {
    if (wishlistTargetId) return
    const first = wishlists[0]
    if (first) setWishlistTargetId(first.id)
  }, [wishlists, wishlistTargetId])

  const removeFavorite = async (productId: string) => {
    setError(null)
    setNotice(null)
    try {
      const data = await apiJson<{ items: Product[] }>(`/favorites/${productId}`, {
        method: "DELETE",
      })
      setItems(data.items)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "取消收藏失败")
    }
  }

  const toggleInspiration = (item: PromoTile) => {
    setError(null)
    setNotice(null)
    const id = inspirationKey(item)
    const next = toggleSavedInspiration(id)
    setInspirationIds(next)
    setNotice(next.includes(id) ? "已收藏家居灵感" : "已取消收藏家居灵感")
  }

  const submitWishlist = () => {
    if (!wishlistName.trim()) return
    const next = createWishlist(wishlistName)
    setWishlists(next)
    setWishlistName("")
    setIsCreatingWishlist(false)
    const created = next[next.length - 1]
    if (created) setWishlistTargetId(created.id)
    setNotice("心愿单已创建")
  }

  const addFavoriteToWishlist = (productId: string) => {
    setError(null)
    setNotice(null)

    if (wishlists.length === 0) {
      const next = createWishlist("我的心愿单")
      const target = next[next.length - 1]
      setWishlists(next)
      if (target) {
        setWishlistTargetId(target.id)
        setWishlists(addToWishlist(target.id, productId))
      }
      setNotice("已创建心愿单并加入商品")
      return
    }

    const targetId = wishlistTargetId ?? wishlists[0]?.id
    if (!targetId) return
    setWishlistTargetId(targetId)
    setWishlists(addToWishlist(targetId, productId))
    setNotice("已加入心愿单")
  }

  const removeFromWishlistById = (wishlistId: string, productId: string) => {
    setWishlists(removeFromWishlist(wishlistId, productId))
    setNotice("已从心愿单移除")
  }

  const removeWishlist = (wishlistId: string) => {
    const next = deleteWishlist(wishlistId)
    setWishlists(next)
    setWishlistTargetId(null)
    setNotice("心愿单已删除")
  }

  const renderEmptyState = (
    text: string,
    actionLabel: string,
    action?: { href?: string; onClick?: () => void },
  ) => (
    <div className="flex flex-col items-center py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/collection-empty.svg" alt="" className="h-32 w-32" />
      <p className="mt-6 text-sm text-ikea-muted">{text}</p>
      {action?.href ? (
        <Link href={action.href} className="i-btn i-btn--small i-btn--primary mt-6">
          <span className="i-btn__inner">
            <span className="i-btn__label">{actionLabel}</span>
          </span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={action?.onClick}
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

  const catalogById = new Map(catalogProducts.map((product) => [product.id, product]))

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
        {notice ? (
          <p className="mt-4 rounded bg-blue-50 px-4 py-3 text-center text-sm text-ikea-blue">
            {notice}
          </p>
        ) : null}

        {activeTab === "inspiration" ? (
          inspirationItems.length === 0 ? (
            renderEmptyState("暂时没有健康灵感内容", "去逛逛", { href: "/cn/zh/all-products/" })
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {inspirationItems.map((item) => {
                const id = inspirationKey(item)
                const saved = inspirationIds.includes(id)
                return (
                  <article
                    key={id}
                    className="group relative overflow-hidden rounded border border-ikea-gray-200 bg-white"
                  >
                    <Link href={item.ctaHref ?? item.href ?? "/cn/zh/all-products/"}>
                      {item.image ? (
                        <SiteImage
                          src={item.image}
                          alt={item.title}
                          className="aspect-[4/3] w-full bg-ikea-gray-100"
                          imgClassName="h-full w-full object-contain object-center p-4 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : null}
                    </Link>
                    <button
                      type="button"
                      aria-label={saved ? "取消收藏灵感" : "收藏灵感"}
                      onClick={() => toggleInspiration(item)}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
                    >
                      <HeartIcon
                        className={`h-4 w-4 ${saved ? "text-ikea-red" : "text-ikea-black"}`}
                      />
                    </button>
                    <div className="p-4">
                      {item.eyebrow ? (
                        <p className="text-xs font-bold text-ikea-muted">{item.eyebrow}</p>
                      ) : null}
                      <h2 className="mt-1 text-base font-bold leading-6">{item.title}</h2>
                      {item.description ? (
                        <p className="mt-2 text-sm leading-6 text-ikea-muted">{item.description}</p>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>
          )
        ) : activeTab === "wishlist" ? (
          <div className="mt-5">
            {wishlists.length === 0 && !isCreatingWishlist ? (
              renderEmptyState("您还没有创建心愿单", "新建心愿单", {
                onClick: () => setIsCreatingWishlist(true),
              })
            ) : (
              <>
                {isCreatingWishlist ? (
                  <div className="mb-6 flex max-w-xl items-center gap-2">
                    <input
                      autoFocus
                      value={wishlistName}
                      onChange={(event) => setWishlistName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          submitWishlist()
                        }
                      }}
                      placeholder="心愿单名称"
                      className="h-11 flex-1 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                    />
                    <button
                      type="button"
                      onClick={submitWishlist}
                      className="i-btn i-btn--small i-btn--primary h-11 px-5 text-sm font-bold"
                    >
                      创建
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingWishlist(false)}
                      className="h-11 px-3 text-sm text-ikea-muted hover:text-ikea-black"
                    >
                      取消
                    </button>
                  </div>
                ) : null}

                {!isCreatingWishlist ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingWishlist(true)}
                    className="i-btn i-btn--small i-btn--secondary mb-6 h-10 px-5 text-sm font-bold"
                  >
                    新建心愿单
                  </button>
                ) : null}

                <div className="space-y-6">
                  {wishlists.map((wishlist) => {
                    const wishlistProducts = wishlist.productIds
                      .map((id) => catalogById.get(id))
                      .filter((product): product is ProductData => Boolean(product))
                    return (
                      <section
                        key={wishlist.id}
                        className="rounded border border-ikea-gray-200 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ikea-gray-100 pb-4">
                          <input
                            value={wishlist.name}
                            onChange={(event) =>
                              setWishlists(renameWishlist(wishlist.id, event.target.value))
                            }
                            className="min-w-0 flex-1 rounded border border-transparent bg-transparent text-base font-bold outline-none hover:border-ikea-gray-200 focus:border-ikea-blue"
                            aria-label="心愿单名称"
                          />
                          <span className="text-sm text-ikea-muted">
                            {wishlistProducts.length} 件商品
                          </span>
                          <button
                            type="button"
                            onClick={() => removeWishlist(wishlist.id)}
                            className="text-sm text-ikea-muted hover:text-red-600"
                          >
                            删除心愿单
                          </button>
                        </div>
                        {wishlistProducts.length === 0 ? (
                          <p className="py-10 text-center text-sm text-ikea-muted">
                            在「商品」标签页点击「加入心愿单」即可添加商品
                          </p>
                        ) : (
                          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                            {wishlistProducts.map((product) => (
                              <div key={product.id} className="relative flex flex-col">
                                <Link href={`/cn/zh/p/${product.slug}/`} className="block">
                                  <SiteImage
                                    src={product.image}
                                    alt={product.name}
                                    className="aspect-square w-full bg-white"
                                    imgClassName="h-full w-full object-contain object-center"
                                  />
                                </Link>
                                <button
                                  type="button"
                                  aria-label="移出心愿单"
                                  onClick={() => removeFromWishlistById(wishlist.id, product.id)}
                                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ikea-muted shadow hover:text-red-600"
                                >
                                  ×
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
                      </section>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        ) : loading ? (
          <p className="py-16 text-center text-sm text-ikea-muted">加载收藏中…</p>
        ) : items.length === 0 ? (
          renderEmptyState("您还没有收藏商品", "去逛逛", { href: "/cn/zh/all-products/" })
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
                <div className="mt-3 flex items-center gap-2">
                  {wishlists.length > 0 ? (
                    <select
                      value={wishlistTargetId ?? ""}
                      onChange={(event) => setWishlistTargetId(event.target.value)}
                      className="min-w-0 flex-1 rounded border border-ikea-gray-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-ikea-blue"
                      aria-label="选择心愿单"
                    >
                      {wishlists.map((wishlist) => (
                        <option key={wishlist.id} value={wishlist.id}>
                          {wishlist.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => addFavoriteToWishlist(product.id)}
                    className="rounded border border-ikea-gray-200 px-3 py-1.5 text-xs font-bold hover:border-ikea-black"
                  >
                    加入心愿单
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
