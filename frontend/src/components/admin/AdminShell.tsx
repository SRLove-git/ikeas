"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { LogoutButton } from "@/components/admin/LogoutButton"
import { SideNav, type NavGroup } from "@/components/admin/SideNav"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const NAV_GROUPS: NavGroup[] = [
    {
      title: t("admin.shell.overview"),
      items: [{ href: "/admin", label: t("admin.shell.dashboard") }],
    },
    {
      title: t("admin.shell.products"),
      description: t("admin.shell.productsDesc"),
      items: [
        { href: "/admin/products", label: t("admin.shell.productManagement") },
        { href: "/admin/categories", label: t("admin.shell.categories") },
        { href: "/admin/catalog-pages", label: t("admin.shell.catalogPages") },
      ],
    },
    {
      title: t("admin.shell.content"),
      description: t("admin.shell.contentDesc"),
      items: [
        { href: "/admin/homepage", label: t("admin.shell.homepageManagement") },
        { href: "/admin/pages", label: t("admin.shell.pageContent") },
        { href: "/admin/menu", label: t("admin.shell.navMenu") },
        { href: "/admin/chat-knowledge", label: t("admin.shell.chatKnowledge") },
      ],
    },
    {
      title: t("admin.shell.trading"),
      description: t("admin.shell.tradingDesc"),
      items: [
        { href: "/admin/orders", label: t("admin.shell.orderManagement") },
        { href: "/admin/users", label: t("admin.shell.userManagement") },
        { href: "/admin/carts", label: t("admin.shell.carts") },
        { href: "/admin/favorites", label: t("admin.shell.favorites") },
        { href: "/admin/chat", label: t("admin.shell.chat") },
      ],
    },
    {
      title: t("admin.shell.marketing"),
      description: t("admin.shell.marketingDesc"),
      items: [{ href: "/admin/marketing", label: t("admin.shell.marketingAndMembers") }],
    },
    {
      title: t("admin.shell.system"),
      description: t("admin.shell.systemDesc"),
      items: [
        { href: "/admin/settings", label: t("admin.shell.siteSettings") },
        { href: "/admin/changelog", label: t("admin.shell.changelog") },
      ],
    },
  ]
  return (
    <div className="flex min-h-screen bg-ikea-gray-100 text-ikea-black">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-blue-950">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-ikea-blue text-sm font-black text-white">
            B
          </div>
          <div>
            <div className="text-sm font-bold text-white">{t("admin.shell.brand")}</div>
            <div className="text-[10px] text-blue-200/70">{t("admin.shell.liveBadge")}</div>
          </div>
        </div>
        <SideNav groups={NAV_GROUPS} />
        <div className="border-t border-white/10 p-3">
          <LanguageSwitch className="mb-2 justify-center text-xs text-white/70" />
          <Link
            href="/"
            target="_blank"
            className="mb-2 block rounded-md bg-white/10 px-2.5 py-2 text-center text-xs font-medium text-white hover:bg-white/20"
          >
            {t("admin.shell.viewSite")} ↗
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="ml-56 flex-1">
        <div className="sticky top-0 z-40 flex items-center justify-end border-b border-ikea-gray-200 bg-white/95 px-8 py-2.5 backdrop-blur">
          <LanguageSwitch className="text-xs" />
        </div>
        <div className="px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
