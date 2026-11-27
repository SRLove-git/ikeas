"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { CartIcon, SearchIcon } from "@/components/icons"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { portalLocalizedHref, type Locale } from "@/i18n/config"

interface PortalMobileNavProps {
  labels: {
    menu: string
    close: string
    medical: string
    home: string
    account: string
    orders: string
    support: string
    login: string
    search: string
    cart: string
  }
  medicalUrl: string
  homeUrl: string
  languageHrefs: Partial<Record<Locale, string>>
  locale: Locale
}

export function PortalMobileNav({
  labels,
  medicalUrl,
  homeUrl,
  languageHrefs,
  locale,
}: PortalMobileNavProps) {
  const localizedHref = (href: string) => portalLocalizedHref(locale, href)
  const [open, setOpen] = useState(false)
  // The header owns a transform (hide on scroll), which would trap a fixed
  // overlay inside the 68px header box — so the panel is portalled to <body>.
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const trigger = triggerRef.current
    document.body.style.overflow = "hidden"
    const firstLink = panelRef.current?.querySelector<HTMLElement>("nav a")
    firstLink?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
      trigger?.focus()
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="portal-menu-button"
        aria-expanded={open}
        aria-controls="portal-mobile-menu"
        aria-label={labels.menu}
        onClick={() => setOpen(true)}
      >
        <span />
        <span />
      </button>

      {mounted && open
        ? createPortal(
            <div
              id="portal-mobile-menu"
              ref={panelRef}
              className="portal-mobile-menu portal-rn"
              role="dialog"
              aria-modal="true"
              aria-label={labels.menu}
            >
              <div className="flex items-center justify-between border-b border-white/15 px-5 py-5">
                <span className="portal-wordmark">
                  <Image
                    src="/images/logo/logo.png"
                    alt="CHUNG YIP"
                    width={480}
                    height={334}
                    className="portal-wordmark__logo"
                  />
                </span>
                <button
                  type="button"
                  className="portal-mobile-menu__close"
                  aria-label={labels.close}
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>

              <nav className="grid px-5 pt-8" aria-label={labels.menu}>
                {[
                  ["01", labels.medical, medicalUrl],
                  ["02", labels.home, homeUrl],
                  ["03", labels.account, localizedHref("/zh/profile/")],
                  ["04", labels.orders, localizedHref("/zh/profile/my-orders/")],
                  ["05", labels.support, localizedHref("/zh/customer-service/")],
                  ["06", labels.login, localizedHref("/zh/profile/login/")],
                ].map(([index, label, href]) => (
                  <a
                    key={index}
                    href={href}
                    className="group flex items-center gap-5 border-b border-white/15 py-5 text-white"
                    onClick={() => setOpen(false)}
                  >
                    <span className="w-7 text-[10px] tracking-[0.2em] text-white/35">{index}</span>
                    <span className="portal-display text-[clamp(1.75rem,8vw,2.5rem)] leading-none">
                      {label}
                    </span>
                    <span className="ml-auto text-xl text-white/45 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                ))}
              </nav>

              <div className="mt-auto grid gap-6 border-t border-white/15 px-5 py-7">
                <div className="flex items-center gap-6">
                  <Link
                    href={localizedHref("/zh/search/products/")}
                    className="portal-mobile-menu__utility"
                    aria-label={labels.search}
                  >
                    <SearchIcon width={20} height={20} /> {labels.search}
                  </Link>
                  <Link
                    href={localizedHref("/zh/pay/cart/")}
                    className="portal-mobile-menu__utility"
                    aria-label={labels.cart}
                  >
                    <CartIcon width={20} height={20} /> {labels.cart}
                  </Link>
                </div>
                <LanguageSwitch className="portal-mobile-language" hrefs={languageHrefs} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
