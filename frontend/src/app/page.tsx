import { Footer } from "@/components/Footer"
import { FloatingWidgets } from "@/components/FloatingWidgets"
import { CartDrawer } from "@/components/CartDrawer"
import { Header } from "@/components/Header"
import { HeroCarousel } from "@/components/HeroCarousel"
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

export default function Home() {
  const {
    assurances,
    footerFeaturedCards,
    footerLinkGroups,
    heroSlides,
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
  } = homepage()
  return (
    <main className="text-left">
      <div className="font-ikea">
        <div className="i-layout">
          <NoticeBar items={noticeMessages} />
          <Header
            menuItems={navMenuItems}
            searchHints={searchHints}
            menuPanels={getMenuPanels()}
            categories={getMenuCategories()}
          />
          <div className="i-layout__body">
            <HeroCarousel slides={heroSlides} />
            <div className="clearfix min-h-screen px-0 m-auto mb-8 space-y-8 text-left lg:mb-12 lg:space-y-12 max-w-page">
              <PromoInspirationCard title="BUZUD 精选" items={promoCardItems} />
              <ServiceColumns columns={serviceColumns} />
              <VisualPillSlider title="按分类选购" items={roomPillItems} cta={roomPillCta} />
              <InspirationTipsCard
                title="健康生活小贴士"
                items={inspirationTipsItems}
                cta={inspirationTipsCta}
              />
              <VisualPillSlider
                title="健康生活精选"
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
