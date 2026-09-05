"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { CartIcon, HeartIcon, SearchIcon, UserIcon } from "@/components/icons"
import { MegaMenu, toPath, type CategoryGroup } from "@/components/MegaMenu"
import { MenuPanel } from "@/components/MenuPanel"
import { SearchPanel } from "@/components/SearchPanel"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { useAuth } from "@/lib/auth"
import { apiJson, getToken, type Cart } from "@/lib/api"
import type { MenuPanel as MenuPanelData } from "@/data/menu-panels"
import type { Category } from "@/data/categories"

interface HeaderProps {
  menuItems: { label: string; href: string; hasMegaMenu?: boolean; menuPanelLabel?: string }[]
  searchHints: string[]
  menuPanels: MenuPanelData[]
  categories: Category[]
}

export function Header({ menuItems, searchHints, menuPanels, categories }: HeaderProps) {
  const { t } = useTranslation()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [openPanel, setOpenPanel] = useState<string | null>(null)
  const [bar, setBar] = useState({ width: 0, left: 0, opacity: 0 })
  const [query, setQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const { user } = useAuth()

  const groups: CategoryGroup[] = useMemo(() => {
    const result: CategoryGroup[] = []
    for (const category of categories) {
      const name = category.group?.trim() || t("header.groupOther")
      const group = result.find((candidate) => candidate.name === name)
      if (group) {
        group.categories.push(category)
      } else {
        result.push({ name, categories: [category] })
      }
    }
    return result
  }, [categories, t])

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
  const activeGroup = groups.find((group) => group.name === openMenu)
  const closeMenu = () => {
    setOpenMenu(null)
    setOpenPanel(null)
  }
  const openGroupMenu = (name: string, li: HTMLLIElement | null) => {
    closeSearch()
    setMoreOpen(false)
    setOpenMenu(name)
    setOpenPanel(null)
    if (li) moveActiveBar(li)
  }
  const activateNavItem = (
    item: HeaderProps["menuItems"][number],
    li: HTMLLIElement | null,
  ) => {
    const panel = menuPanels.find((p) => p.label === (item.menuPanelLabel ?? item.label))
    closeSearch()
    setMoreOpen(false)
    setOpenMenu(null)
    setOpenPanel(panel ? panel.label : null)
    if (li) moveActiveBar(li)
  }
  const closeAllMenus = (li: HTMLLIElement | null) => {
    closeSearch()
    setMoreOpen(false)
    closeMenu()
    if (li) moveActiveBar(li)
  }
  const openSearch = () => {
    closeMenu()
    setMoreOpen(false)
    setMobileMenuOpen(false)
    setSearchOpen(true)
  }
  const closeSearch = () => setSearchOpen(false)
  const submitSearch = (value: string) => {
    const q = value.trim()
    if (q) {
      window.location.assign(`/zh/search/products?q=${encodeURIComponent(q)}`)
      return
    }
    setSearchOpen(false)
  }

  const productsEntry = { label: t("header.allProducts"), href: "/zh/all-products/" }
  const moreEntries = [
    productsEntry,
    ...groups.map((group) => ({
      label: group.name,
      href: toPath(group.categories[0]?.url ?? "/zh/all-products/"),
    })),
    ...menuItems.map((item) => ({ label: item.label, href: item.href })),
  ]

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
                        <Link href="/" aria-label={t("header.backHome")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="disable-event"
                            src="https://medical-sg.oss-ap-southeast-1.aliyuncs.com/images/logo/logo-v2.png?x-oss-process=image/resize,w_240,quality,q_85"
                            alt="CHUNG YIP"
                            width={78}
                            height={64}
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <nav className="header-nav hidden lg:block" aria-label={t("header.menuLabel")}>
                    <ul className="header_container_center_ul" onMouseLeave={hideActiveBar}>
                      <span
                        className="active-bar"
                        style={{
                          width: bar.width,
                          transform: `translateX(${bar.left}px)`,
                          opacity: bar.opacity,
                        }}
                      />
                      <li onMouseEnter={(event) => closeAllMenus(event.currentTarget)}>
                        <Link
                          href={productsEntry.href}
                          className="menu-label"
                          onFocus={(event) => closeAllMenus(event.currentTarget.closest("li"))}
                        >
                          {productsEntry.label}
                        </Link>
                      </li>
                      {groups.map((group) => (
                        <li
                          key={`group-${group.name}`}
                          onMouseEnter={(event) => openGroupMenu(group.name, event.currentTarget)}
                        >                          <Link
                            href={toPath(group.categories[0]?.url ?? "/zh/all-products/")}
                            className="menu-label"
                            onFocus={(event) =>
                              openGroupMenu(group.name, event.currentTarget.closest("li"))
                            }
                            onClick={(event) => {
                              // 分组本身没有落地页，点击展开下拉而不是跳到首个分类
                              event.preventDefault()
                              openGroupMenu(group.name, event.currentTarget.closest("li"))
                            }}
                          >
                            {group.name}
                          </Link>
                        </li>
                      ))}
                      {menuItems.map((item) => (
                        <li
                          key={item.label}
                          onMouseEnter={(event) => activateNavItem(item, event.currentTarget)}
                        >
                          <Link
                            href={item.href}
                            className="menu-label"
                            onFocus={(event) => activateNavItem(item, event.currentTarget.closest("li"))}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                      {moreEntries.length > 1 ? (
                        <li
                          className="header-nav-more"
                          onMouseEnter={(event) => {
                            closeSearch()
                            closeMenu()
                            setMoreOpen(true)
                            moveActiveBar(event.currentTarget)
                          }}
                          onMouseLeave={() => setMoreOpen(false)}
                        >
                          <button
                            type="button"
                            className="menu-label header-nav-more-trigger"
                            aria-haspopup="true"
                            aria-expanded={moreOpen}
                            onClick={() => setMoreOpen((current) => !current)}
                          >
                            {t("header.more")}
                            <svg
                              viewBox="0 0 24 24"
                              className={`header-nav-more-chevron ${moreOpen ? "header-nav-more-chevron--open" : ""}`}
                              aria-hidden="true"
                            >
                              <path
                                d="m6 9 6 6 6-6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          {moreOpen ? (
                            <ul className="header-nav-more-dropdown">
                              {moreEntries.slice(1).map((entry) => (
                                <li key={entry.label}>
                                  <Link
                                    href={entry.href}
                                    className="header-nav-more-link"
                                    onClick={() => setMoreOpen(false)}
                                  >
                                    {entry.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ) : null}
                    </ul>
                  </nav>
                  <div className="header_container_right">
                    <div className="header_container_right_img header-right-cluster">
                      <LanguageSwitch className="header-lang-switch" />
                      <span className="header-right-divider hidden md:block" aria-hidden="true" />
                      <button
                        type="button"
                        className="header-action-btn header-action-btn--compact"
                        onClick={openSearch}
                        aria-label={t("search.aria")}
                      >
                        <SearchIcon width={24} height={24} />
                      </button>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <Link
                            href={user ? "/zh/profile/collection/" : "/zh/profile/login/"}
                            className="header-action-btn header-action-btn--compact"
                          >
                            <HeartIcon width={24} height={24} />
                          </Link>
                          <div className="i-tooltip__body">{t("header.myCollection")}</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          <Link
                            href="/zh/pay/cart/"
                            className="header-action-btn header-action-btn--compact relative"
                            aria-label={t("header.shoppingBag")}
                          >
                            <CartIcon width={24} height={24} />
                            {cartCount > 0 ? (
                              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ikea-red px-1 text-[10px] font-bold text-white">
                                {cartCount}
                              </span>
                            ) : null}
                          </Link>
                          <div className="i-tooltip__body">{t("header.shoppingBag")}</div>
                        </span>
                      </span>
                      <span className="i-tooltip i-tooltip--bottom">
                        <span className="i-tooltip__custom-trigger-wrapper">
                          {user ? (
                            <Link href="/zh/profile/" className="header-action-btn">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ikea-blue text-xs font-bold text-white">
                                {user.name.slice(-1)}
                              </span>
                              <span className="header-user-text hidden">
                                {user.name}
                              </span>
                            </Link>
                          ) : (
                            <Link href="/zh/profile/login/" className="header-action-btn">
                              <UserIcon width={24} height={24} />
                              <span className="header-user-text hidden">
                                {t("header.login")}
                              </span>
                            </Link>
                          )}
                          <div className="i-tooltip__body">
                            {user ? t("header.myProfile") : t("header.loginAccount")}
                          </div>
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={t("header.menuLabel")}
                    aria-expanded={mobileMenuOpen}
                    className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center text-ikea-black lg:hidden"
                    onClick={() => setMobileMenuOpen((current) => !current)}
                  >
                    {mobileMenuOpen ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path d="m12 10.6 6-6 1.4 1.4-6 6 6-1.4 1.4-6-6-6 6L4.6 18l6-6-6-6L6 4.6z" />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="h-6 w-6"
                        aria-hidden="true"
                      >
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {mobileMenuOpen ? (
                <div className="border-t border-ikea-gray-200 bg-white px-5 py-3 lg:hidden">
                  <ul className="space-y-1">
                    <li>
                      <Link
                        href={productsEntry.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2.5 text-sm font-bold text-ikea-black"
                      >
                        {productsEntry.label}
                      </Link>
                    </li>
                    {groups.map((group) => (
                      <li key={`m-group-${group.name}`}>
                        <Link
                          href={toPath(group.categories[0]?.url ?? "/zh/all-products/")}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2.5 text-sm font-bold text-ikea-black"
                        >
                          {group.name}
                        </Link>
                      </li>
                    ))}
                    {menuItems.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2.5 text-sm font-bold text-ikea-black"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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
          {activeGroup ? (
            <div className="mega-menu-layer" onMouseLeave={() => setOpenMenu(null)}>
              <MegaMenu group={activeGroup} />
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
