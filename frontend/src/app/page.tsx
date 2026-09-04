import { Footer } from "@/components/Footer"
import { FloatingWidgets } from "@/components/FloatingWidgets"
import { CartDrawer } from "@/components/CartDrawer"
import { Header } from "@/components/Header"
import { HeroVideo } from "@/components/HeroVideo"
import { InspirationTipsCard } from "@/components/InspirationTipsCard"
import { ProductNotices } from "@/components/ProductNotices"
import { PromoInspirationCard } from "@/components/PromoInspirationCard"
import { ServiceColumns } from "@/components/ServiceColumns"
import { ServicesSection } from "@/components/ServicesSection"
import { VisualPillSlider } from "@/components/VisualPillSlider"
import { homepage } from "@/data/homepage"
import { catalogData } from "@/data/catalog"
import { catalogPages } from "@/lib/catalog-pages"
import { getMenuPanels } from "@/data/menu-panels"
import { getMenuCategories } from "@/data/categories"
import { getLocale, getServerT } from "@/i18n/server"

export default async function Home() {
  const locale = await getLocale()
  const t = await getServerT(locale)
  const {
    assurances,
    footerFeaturedCards,
    footerLinkGroups,
    heroVideos,
    inspirationTipsCta,
    inspirationTipsItems,
    legalBar,
    navMenuItems,
    promoCardItems,
    recallNotices,
    roomPillCta,
    roomPillItems,
    searchHints,
    serviceColumns,
    socialIcons,
    sustainabilityPillCta,
    sustainabilityPillItems,
  } = homepage(locale)
  const { catalogCategories, channelCategories } = catalogData(locale)
  const promoItems = promoCardItems.map((item) => {
    const slug = (item.ctaHref ?? item.href ?? "").split("/").filter(Boolean).at(-1)
    let count: number | null = null
    if (slug) {
      const category = [...catalogCategories, ...channelCategories].find(
        (candidate) => candidate.slug === slug,
      )
      if (category) {
        count = category.products.length
      } else {
        const page = catalogPages(locale).find(
          (candidate) =>
            candidate.url.split("/").filter(Boolean).at(-1) === slug,
        )
        count = page ? (page.productIds ?? []).length : null
      }
    }
    return count != null ? { ...item, description: t("home.promoCount", { count }) } : item
  })
  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <Header
            menuItems={navMenuItems}
            searchHints={searchHints}
            menuPanels={getMenuPanels(locale)}
            categories={getMenuCategories(locale)}
          />
          <div className="i-layout__body">
            <HeroVideo items={heroVideos} />
            <div className="clearfix min-h-screen px-0 m-auto mb-8 space-y-8 text-left lg:mb-12 lg:space-y-12 max-w-page">
              <PromoInspirationCard title={t("home.promoTitle")} items={promoItems} />
              <ServiceColumns columns={serviceColumns} />
              <VisualPillSlider
                title={t("home.shopByCategory")}
                items={roomPillItems}
                cta={roomPillCta}
              />
              <InspirationTipsCard
                title={t("home.healthyTips")}
                items={inspirationTipsItems}
                cta={inspirationTipsCta}
              />
              <VisualPillSlider
                title={t("home.healthyLiving")}
                items={sustainabilityPillItems}
                cta={sustainabilityPillCta}
              />
              <ServicesSection assurances={assurances} />
              <ProductNotices notices={recallNotices} />
            </div>
          </div>
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
