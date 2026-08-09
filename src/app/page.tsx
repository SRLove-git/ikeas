import { Footer } from "@/components/Footer";
import { FloatingWidgets } from "@/components/FloatingWidgets";
import { CartDrawer } from "@/components/CartDrawer";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { InspirationTipsCard } from "@/components/InspirationTipsCard";
import { NoticeBar } from "@/components/NoticeBar";
import { ProductInspiration } from "@/components/ProductInspiration";
import { ProductNotices } from "@/components/ProductNotices";
import { PromoInspirationCard } from "@/components/PromoInspirationCard";
import { RankingSection } from "@/components/RankingSection";
import { ServiceColumns } from "@/components/ServiceColumns";
import { ServicesSection } from "@/components/ServicesSection";
import { VisualPillSlider } from "@/components/VisualPillSlider";
import { homepage } from "@/data/homepage";
import { getMenuPanels } from "@/data/menu-panels";
import { getMenuCategories } from "@/data/categories";
import { allProducts } from "@/data/products-index";

export default function Home() {
  const {
    assurances,
    feedProducts,
    footerFeaturedCards,
    footerLinkGroups,
    heroSlides,
    inspirationTipsItems,
    legalBar,
    navMenuItems,
    noticeMessages,
    promoCardItems,
    rankingSections,
    recallNotices,
    roomPillCta,
    roomPillItems,
    searchHints,
    serviceColumns,
    socialIcons,
    sustainabilityPillCta,
    sustainabilityPillItems,
  } = homepage();
  const inspirationTabs = Object.keys(feedProducts);
  const sampleItems = allProducts().slice(0, 3).map((product, index) => ({
    product,
    qty: index + 1,
  }));

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
            <div className="clearfix min-h-screen px-0 m-auto mb-8 space-y-8 text-left lg:mb-12 lg:space-y-12 max-w-page lg:min-w-1100">
              <PromoInspirationCard title="必逛好物" items={promoCardItems} />
              <ServiceColumns columns={serviceColumns} />
              <RankingSection sections={rankingSections} />
              <VisualPillSlider
                title="从房间开始探索"
                items={roomPillItems}
                cta={roomPillCta}
              />
              <InspirationTipsCard
                title="查看更多家居布置小贴士"
                items={inspirationTipsItems}
              />
              <ProductInspiration
                title="发现更多家居灵感"
                tabs={inspirationTabs}
                products={feedProducts}
              />
              <VisualPillSlider
                title="更可持续生活的创意和技巧"
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
          <CartDrawer sampleItems={sampleItems} />
        </div>
      </div>
    </main>
  );
}
