import { Footer } from "@/components/Footer"
import { Header } from "@/components/Header"
import { FloatingWidgets } from "@/components/FloatingWidgets"
import { CartDrawer } from "@/components/CartDrawer"
import { homepage } from "@/data/homepage"
import { getMenuPanels } from "@/data/menu-panels"
import { getMenuCategories } from "@/data/categories"
import { getLocale } from "@/i18n/server"
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
  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <Header
            menuItems={navMenuItems}
            searchHints={searchHints}
            menuPanels={menuPanels}
            categories={categories}
          />
          {children}
          <Footer
            linkGroups={footerLinkGroups}
            featured={footerFeaturedCards}
            socialIcons={socialIcons}
            legal={legalBar}
          />
          <FloatingWidgets />
          <CartDrawer />
        </div>
      </div>
    </main>
  )
}
