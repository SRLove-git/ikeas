"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { ADMIN_SITES, adminPath } from "@/lib/admin-sites"
import { siteUrl, type SiteScope } from "@/lib/site-scope"
import { useTranslation } from "react-i18next"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { LogoutButton } from "@/components/admin/LogoutButton"
import { SideNav, type NavGroup } from "@/components/admin/SideNav"

export function AdminShell({ site, children }: { site: SiteScope; children: React.ReactNode }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const siteItems = [{ href: adminPath(site), label: t("admin.shell.homepageManagement") }]
  if (site === "home")
    siteItems.push({ href: adminPath(site, "brands"), label: t("admin.shell.brandCatalog") })
  if (site === "medical")
    siteItems.push({ href: adminPath(site, "products"), label: t("admin.shell.productManagement") })
  const isShared = !siteItems.some(({ href }) => pathname.startsWith(href))
  const sharedGroups: NavGroup[] = [
    {
      title: t("admin.shell.overview"),
      items: [{ href: "/admin/overview", label: t("admin.shell.dashboard") }],
    },
    {
      title: t("admin.shell.content"),
      items: [
        { href: "/admin/template", label: t("admin.workspace.template") },
        { href: "/admin/categories", label: t("admin.shell.categories") },
        { href: "/admin/catalog-pages", label: t("admin.shell.catalogPages") },
        { href: "/admin/pages", label: t("admin.shell.pageContent") },
        { href: "/admin/menu", label: t("admin.shell.navMenu") },
        { href: "/admin/chat-knowledge", label: t("admin.shell.chatKnowledge") },
      ],
    },
    {
      title: t("admin.shell.trading"),
      description: t("admin.shell.tradingDesc"),
      items: [
        { href: "/admin/users", label: t("admin.shell.userManagement") },
        { href: "/admin/carts", label: t("admin.shell.carts") },
        { href: "/admin/favorites", label: t("admin.shell.favorites") },
        { href: "/admin/chat", label: t("admin.shell.chat") },
      ],
    },
    {
      title: t("admin.shell.marketing"),
      description: t("admin.shell.marketingDesc"),
      items: [
        { href: "/admin/marketing", label: t("admin.shell.marketingAndMembers") },
        { href: "/admin/vouchers", label: t("admin.shell.vouchers") },
        { href: "/admin/bookings", label: t("admin.shell.bookings") },
      ],
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
  const groups = [
    { title: t("admin.workspace.current"), items: siteItems },
    ...sharedGroups.map((group) => ({
      ...group,
      title: `${t("admin.workspace.shared")} · ${group.title}`,
      items: group.items.map((item) => ({ ...item, href: adminPath(site, item.href.slice(7)) })),
    })),
  ]
  return (
    <div className="flex min-h-screen bg-ikea-gray-100 text-ikea-black">
      {menuOpen && (
        <button
          type="button"
          aria-label={t("admin.shell.navMenu")}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <aside
        id="admin-navigation"
        className={`fixed inset-y-0 left-0 z-50 w-56 flex-col bg-blue-950 md:flex ${menuOpen ? "flex" : "hidden"}`}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <button
            type="button"
            aria-label={t("admin.shell.navMenu")}
            className="text-white md:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded bg-ikea-blue text-sm font-black text-white">
            B
          </div>
          <div>
            <div className="text-sm font-bold text-white">{t("admin.shell.brand")}</div>
            <div className="text-[10px] text-blue-200/70">{t("admin.shell.liveBadge")}</div>
          </div>
        </div>
        <SideNav groups={groups} onNavigate={() => setMenuOpen(false)} />
        <div className="border-t border-white/10 p-3">
          <LanguageSwitch className="mb-2 justify-center text-xs text-white/70" />
          <a
            href={siteUrl(site)}
            target="_blank"
            className="mb-2 block rounded-md bg-white/10 px-2.5 py-2 text-center text-xs font-medium text-white hover:bg-white/20"
          >
            {t("admin.shell.viewSite")} ↗
          </a>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 md:ml-56">
        <div className="sticky top-0 z-40 flex items-center flex-wrap justify-between gap-2 border-b border-ikea-gray-200 bg-white/95 px-3 py-2.5 md:px-8 backdrop-blur">
          <button
            type="button"
            aria-label={t("admin.shell.navMenu")}
            aria-controls="admin-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="p-2 md:hidden"
          >
            <Menu size={20} />
          </button>
          <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">
            {t("admin.workspace.site")}
            <select
              className="rounded-md border border-ikea-gray-300 bg-white px-3 py-2"
              value={site}
              onChange={(event) => {
                const next = ADMIN_SITES.find((candidate) => candidate === event.target.value)
                if (next) router.push(adminPath(next))
              }}
            >
              {ADMIN_SITES.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {t(`admin.workspace.${candidate}`)} · {new URL(siteUrl(candidate)).host}
                </option>
              ))}
            </select>
            {isShared && (
              <span className="text-xs text-ikea-muted">{t("admin.workspace.shared")}</span>
            )}
          </label>
          <LanguageSwitch className="text-xs" />
        </div>
        <div className="px-3 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  )
}
