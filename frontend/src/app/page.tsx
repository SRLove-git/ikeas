import { Footer } from "@/components/Footer"
import { FloatingWidgets } from "@/components/FloatingWidgets"
import { CartDrawer } from "@/components/CartDrawer"
import { Header } from "@/components/Header"
import { HeroVideo } from "@/components/HeroVideo"
import { InspirationTipsCard } from "@/components/InspirationTipsCard"
import { NoticeBar } from "@/components/NoticeBar"
import { ProductNotices } from "@/components/ProductNotices"
import { PromoInspirationCard } from "@/components/PromoInspirationCard"
import { ServiceColumns } from "@/components/ServiceColumns"
import { ServicesSection } from "@/components/ServicesSection"
import { VisualPillSlider } from "@/components/VisualPillSlider"
import { homepage } from "@/data/homepage"
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
    heroVideo,
    inspirationTipsCta,
    inspirationTipsItems,
    legalBar,
    navMenuItems,
    noticeMessages,
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
  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <NoticeBar items={noticeMessages} />
          <Header
            menuItems={navMenuItems}
            searchHints={searchHints}
            menuPanels={getMenuPanels(locale)}
            categories={getMenuCategories(locale)}
          />
          <div className="i-layout__body">
            <HeroVideo
              video={heroVideo.video}
              poster={heroVideo.poster}
              href={heroVideo.href}
              alt={heroVideo.alt}
            />
            <div className="clearfix min-h-screen px-0 m-auto mb-8 space-y-8 text-left lg:mb-12 lg:space-y-12 max-w-page">
              <PromoInspirationCard title={t("home.promoTitle")} items={promoCardItems} />
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
