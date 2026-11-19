import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { FloatingWidgets } from "@/components/FloatingWidgets"
import { CartDrawer } from "@/components/CartDrawer"
import { homepage } from "@/data/homepage"
import { getMenuPanels } from "@/data/menu-panels"
import { getMenuCategories } from "@/data/categories"
import { getLocale } from "@/i18n/server"
import { SITE_SCOPE } from "@/lib/site-scope"
import type { Locale } from "@/i18n/config"

export async function SiteLayout({
  children,
  locale: forcedLocale,
}: {
  children: React.ReactNode
  locale?: Locale
}) {
  const locale = forcedLocale ?? (await getLocale())
  const {
    footerFeaturedCards,
    footerLinkGroups,
    legalBar,
    navMenuItems,
    searchHints,
    socialIcons,
  } = homepage(locale)
  const menuPanels = getMenuPanels(locale)
  const categories = getMenuCategories(locale)
  const isZh = locale === "zh-CN"
  // Never ship the other catalogue's search suggestions to a storefront.
  const scopedSearchHints = SITE_SCOPE === "home" ? [] : searchHints
  const scopedFooterLinkGroups =
    SITE_SCOPE === "home"
      ? footerLinkGroups.map((group, index) =>
          index === 0
            ? {
                ...group,
                links: [
                  { label: isZh ? "全部家电" : "All appliances", href: "/zh/all-products/" },
                  { label: "Toshiba", href: "/zh/toshiba/" },
                  { label: "Midea", href: "/zh/midea/" },
                ],
              }
            : group,
        )
      : footerLinkGroups
  const scopedFeaturedCards =
    SITE_SCOPE === "home"
      ? [
          {
            title: isZh ? "选购东芝与美的家电" : "Shop Toshiba & Midea appliances",
            description: isZh
              ? "官方渠道正品保障，支持新加坡全岛配送、安装与售后服务。"
              : "Genuine products with islandwide delivery, installation and after-sales support.",
            ctaLabel: isZh ? "查看全部家电" : "Browse all appliances",
            href: "/zh/all-products/",
          },
        ]
      : footerFeaturedCards
  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <Header
            menuItems={navMenuItems}
            searchHints={scopedSearchHints}
            menuPanels={menuPanels}
            categories={categories}
            scope={SITE_SCOPE}
          />
          {children}
          <Footer
            linkGroups={scopedFooterLinkGroups}
            featured={scopedFeaturedCards}
            socialIcons={socialIcons}
            legal={legalBar}
            scope={SITE_SCOPE}
          />
          <FloatingWidgets />
          <CartDrawer />
        </div>
      </div>
    </main>
  )
}
