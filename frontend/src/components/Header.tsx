"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CartIcon, HeartIcon, SearchIcon, UserIcon } from "@/components/icons"
import { MegaMenu } from "@/components/MegaMenu"
import { MenuPanel } from "@/components/MenuPanel"
import { SearchPanel } from "@/components/SearchPanel"
import { useAuth } from "@/lib/auth"
import { apiJson, getToken, type Cart } from "@/lib/api"
import type { MenuPanel as MenuPanelData } from "@/data/menu-panels"
import type { Category } from "@/data/categories"

interface HeaderProps {
  menuItems: { label: string; href: string; hasMegaMenu?: boolean }[]
  searchHints: string[]
  menuPanels: MenuPanelData[]
  categories: Category[]
}

export function Header({ menuItems, searchHints, menuPanels, categories }: HeaderProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [hintIndex, setHintIndex] = useState(0)
  const [bar, setBar] = useState({ width: 0, left: 0, opacity: 0 })
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (searchHints.length < 2) return
    const id = window.setInterval(() => {
      setHintIndex((current) => (current + 1) % searchHints.length)
    }, 3000)
    return () => window.clearInterval(id)
  }, [searchHints.length])

  useEffect(() => {
    let cancelled = false

    const refreshCartCount = async () => {
      if (!getToken()) return
      try {
        const cart = await apiJson<Cart>("/cart")
        if (!cancelled) setCartCount(cart.totalQuantity)
      } catch {
        if (!cancelled) setCartCount(0)
      }
    }

    const handleCartChanged = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail
      if (typeof detail === "number") {
        setCartCount(detail)
        return
      }
      void refreshCartCount()
    }

    void refreshCartCount()
    window.addEventListener("ikea:cart-changed", handleCartChanged)
    return () => {
      cancelled = true
      window.removeEventListener("ikea:cart-changed", handleCartChanged)
    }
  }, [])

  const moveActiveBar = (item: HTMLLIElement) => {
    const label = item.querySelector(".menu-label") ?? item
    const rect = label.getBoundingClientRect()
    const top = document.querySelector(".header_container_top")
    if (!top) return
    const topRect = top.getBoundingClientRect()
    setBar({
      width: rect.width,
      left: rect.left - topRect.left,
      opacity: 1,
    })
  }

  const hideActiveBar = () => setBar((prev) => ({ ...prev, opacity: 0 }))

  const activePanel = menuPanels.find((panel) => panel.label === openPanel)
  const closeMenu = () => {
    setOpenMenu(null)
    setOpenPanel(null)
  }
  const openSearch = () => {
    closeMenu()
    setSearchOpen(true)
  }
  const closeSearch = () => setSearchOpen(false)
  const submitSearch = (value: string) => {
    const q = value.trim()
    if (q) {
      window.location.assign(`/cn/zh/search/products?q=${encodeURIComponent(q)}`)
      return
    }
    setSearchOpen(false)
  }

  return (
    <div className="i-layout__header i-layout__header--sticky">
      <div className="nav-header">
        <div className="nav-header_container">
          <div className="move-hover">
            <div className="header_container_top">
              <div className="header_container_top_content">
                <div className="header_container_top_content__inner">
                  <div className="header_container_left">
                    <div className="header_container_center">
                      <div className="header_container_center_Logo">
                        <Link href="/" aria-label="返回首页">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="disable-event"
                            src="/images/logo/logo.jpg"
                            alt="BUZUD"
                            width={48}
                            height={64}
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="search-bar-container">
                    <form
                      className="s-header"
                      role="search"
                      onSubmit={(event) => {
                        event.preventDefault()
                        submitSearch(query)
                      }}
                    >
                      <input
                        className="s-input"
                        type="text"
                        aria-label="search"
                        placeholder=""
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={openSearch}
                        onClick={openSearch}
                      />
                      <span className="search-icon">
                        <SearchIcon width={24} height={24} />
                      </span>
                      <div className="s-header-notice">
                        <div className="i-notice">
                          <div
                            className="i-notice-hints"
                            style={{ transform: `translateY(-${hintIndex * 30}px)` }}
                          >
                            {searchHints.map((hint) => (
                              <p key={hint}>{hint}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="header_container_right">
                    <div className="header_container_right_img">
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          {user ? (
                            <Link
                              href="/cn/zh/profile/"
                              className="header-action-btn header-action-btn--login"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ikea-blue text-xs font-bold text-white">
                                {user.name.slice(-1)}
                              </span>
                              <span>{user.name}</span>
                            </Link>
                          ) : (
                            <Link
                              href="/cn/zh/profile/login/"
                              className="header-action-btn header-action-btn--login"
                            >
                              <UserIcon width={24} height={24} />
                              <span>登录 BUZUD 账号</span>
                            </Link>
                          )}
                          <div className="i-tooltip__body">登录 BUZUD 账号</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <Link
                            href={user ? "/cn/zh/profile/" : "/cn/zh/profile/login/"}
                            className="header-action-btn"
                          >
                            <UserIcon width={24} height={24} />
                          </Link>
                          <div className="i-tooltip__body">我的个人档案</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <Link
                            href={user ? "/cn/zh/profile/collection/" : "/cn/zh/profile/login/"}
                            className="header-action-btn"
                          >
                            <HeartIcon width={24} height={24} />
                          </Link>
                          <div className="i-tooltip__body">我的收藏</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <Link
                            href="/cn/zh/pay/cart/"
                            className="header-action-btn relative"
                            aria-label="购物袋"
                          >
                            <CartIcon width={24} height={24} />
                            {cartCount > 0 ? (
                              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ikea-red px-1 text-[10px] font-bold text-white">
                                {cartCount}
                              </span>
                            ) : null}
                          </Link>
                          <div className="i-tooltip__body">购物袋</div>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="header_container_menu_content">
                <ul className="header_container_center_ul" onMouseLeave={hideActiveBar}>
                  <span
                    className="active-bar"
                    style={{
                      width: bar.width,
                      transform: `translateX(${bar.left}px)`,
                      opacity: bar.opacity,
                    }}
                  />
                  {menuItems.map((item) => (
                    <li
                      key={item.label}
                      onMouseEnter={(event) => {
                        const panel = menuPanels.find((p) => p.label === item.label)
                        closeSearch()
                        setOpenMenu(item.hasMegaMenu ? item.label : null)
                        setOpenPanel(panel ? panel.label : null)
                        moveActiveBar(event.currentTarget)
                      }}
                    >
                      <span className="menu-label">{item.label}</span>
                      {item.label === "所有商品" ? <span className="new_feature_mark" /> : null}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {openMenu || activePanel || searchOpen ? (
            <button
              type="button"
              className="nav-header-mega-mask"
              aria-label="Close menu"
              onClick={() => {
                closeMenu()
                closeSearch()
              }}
              tabIndex={-1}
            />
          ) : null}
          {searchOpen ? (
            <div className="mega-menu-layer search-panel-layer">
              <SearchPanel
                query={query}
                searchHints={searchHints}
                categories={categories}
                onQueryChange={setQuery}
                onSubmit={submitSearch}
                onClose={closeSearch}
              />
            </div>
          ) : null}
          {openMenu ? (
            <div className="mega-menu-layer" onMouseLeave={() => setOpenMenu(null)}>
              <MegaMenu categories={categories} />
            </div>
          ) : null}
          {activePanel ? (
            <div className="mega-menu-layer" onMouseLeave={() => setOpenPanel(null)}>
              <MenuPanel panel={activePanel} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
