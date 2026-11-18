import { Footer } from "@/components/Footer"
import { FloatingWidgets } from "@/components/FloatingWidgets"
import { CartDrawer } from "@/components/CartDrawer"
import { Header } from "@/components/Header"
import { BookingHighlight } from "@/components/BookingHighlight"
import { HeroVideo } from "@/components/HeroVideo"
import { InspirationTipsCard } from "@/components/InspirationTipsCard"
import { PromoInspirationCard } from "@/components/PromoInspirationCard"
import { VisualPillSlider } from "@/components/VisualPillSlider"
import { HomeSiteHome } from "@/components/home-site/HomeSiteHome"
import { PortalHome } from "@/components/portal/PortalHome"
import { homepage } from "@/data/homepage"
import { catalogData } from "@/data/catalog"
import { mideaCommerceProducts, toshibaCommerceProducts } from "@/data/brand-commerce"
import { catalogPages } from "@/lib/catalog-pages"
import { getMenuPanels } from "@/data/menu-panels"
import { getMenuCategories } from "@/data/categories"
import { PORTAL_URL, SITE_SCOPE, isAppliancePath } from "@/lib/site-scope"
import { getLocale, getServerT } from "@/i18n/server"

const showExperienceBooking = process.env.NEXT_PUBLIC_SHOW_EXPERIENCE_BOOKING === "true"

export default async function Home() {
  // Deployment scope landing branches. The dedicated home/portal agents own
  // `<HomeSiteHome />` and `<PortalHome />`; keep this switch tiny so their
  // implementations can evolve independently.
  if (SITE_SCOPE === "portal") return <PortalHome />
  if (SITE_SCOPE === "home") return <HomeSiteHome />

  const locale = await getLocale()
  const isZh = locale === "zh-CN"
  const t = await getServerT(locale)
  const {
    footerFeaturedCards,
    footerLinkGroups,
    heroVideos,
    inspirationTipsItems,
    legalBar,
    navMenuItems,
    promoCardItems,
    roomPillCta,
    roomPillItems,
    searchHints,
    socialIcons,
    sustainabilityPillCta,
    sustainabilityPillItems,
  } = homepage(locale)
  const { catalogCategories, channelCategories } = catalogData(locale)
  // Home appliances live in their own brand catalogues, so resolve the promo
  // card counts from the brand commerce snapshots as well.
  const brandProductCount = {
    midea: mideaCommerceProducts(locale).length,
    toshiba: toshibaCommerceProducts(locale).length,
  }
  const promoItems = promoCardItems
    // The medical homepage never promotes appliance catalogues.
    .filter((item) => !isAppliancePath(item.ctaHref ?? item.href ?? ""))
    .map((item) => {
      const slug = (item.ctaHref ?? item.href ?? "").split("/").filter(Boolean).at(-1)
      const brandSlug = slug === "midea" || slug === "toshiba" ? slug : null
      let count: number | null = null
      if (slug) {
        const category = [...catalogCategories, ...channelCategories].find(
          (candidate) => candidate.slug === slug,
        )
        if (category) {
          count = category.products.length
        } else {
          const page = catalogPages(locale).find(
            (candidate) => candidate.url.split("/").filter(Boolean).at(-1) === slug,
          )
          count = page ? (page.productIds ?? []).length : null
          if (count == null && brandSlug) count = brandProductCount[brandSlug]
        }
      }
      if (count == null) return item
      return {
        ...item,
        description: t(brandSlug ? "home.promoApplianceCount" : "home.promoCount", { count }),
      }
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
            scope={SITE_SCOPE}
          />
          <div className="i-layout__body">
            <section className="mx-auto max-w-page pt-5 lg:pt-7">
              <div className="flex flex-col gap-5 border-b border-ikea-gray-200 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ikea-muted">
                    {isZh ? "医疗健康 · BUZUD" : "Medical & Health · BUZUD"}
                  </p>
                  <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                    {isZh
                      ? "专业健康管理，从家开始"
                      : "Professional health support, closer to home"}
                  </h1>
                </div>
                <div className="max-w-lg md:text-right">
                  <p className="text-sm leading-6 text-ikea-muted">
                    {isZh
                      ? "从日常监测、呼吸护理到康复辅助，精选适合家庭与专业场景的健康产品。"
                      : "From daily monitoring and respiratory care to rehabilitation support, find health products for home and professional use."}
                  </p>
                  <a
                    href={PORTAL_URL}
                    className="mt-3 inline-flex text-xs font-bold text-ikea-black underline decoration-1 underline-offset-4 hover:text-ikea-blue"
                  >
                    {isZh ? "返回 CHUNG YIP 总入口 →" : "Back to CHUNG YIP portal →"}
                  </a>
                </div>
              </div>
            </section>
            <HeroVideo
              compact
              items={heroVideos.filter((item) => !isAppliancePath(item.href ?? ""))}
            />
            <div className="clearfix min-h-screen px-0 m-auto mt-4 mb-8 space-y-8 text-left lg:mt-6 lg:mb-12 lg:space-y-12 max-w-page">
              {showExperienceBooking ? (
                <BookingHighlight
                  eyebrow={t("home.bookingEyebrow")}
                  title={t("home.bookingTitle")}
                  description={t("home.bookingDescription")}
                  cta={t("home.bookingCta")}
                  imageAlt={t("home.bookingImageAlt")}
                  services={[
                    t("home.bookingServiceOxygen"),
                    t("home.bookingServiceBody"),
                    t("home.bookingServiceBlood"),
                    t("home.bookingServicePressure"),
                  ]}
                  image="https://medical-sg.oss-ap-southeast-1.aliyuncs.com/images/products/buzud-8885020711448-1.png"
                  href="/zh/booking/"
                />
              ) : null}
              <PromoInspirationCard title={t("home.promoTitle")} items={promoItems} />
              <VisualPillSlider
                title={t("home.shopByCategory")}
                items={roomPillItems.filter((item) => !isAppliancePath(item.href ?? ""))}
                cta={roomPillCta}
              />
              <InspirationTipsCard title={t("home.healthyTips")} items={inspirationTipsItems} />
              <VisualPillSlider
                title={t("home.healthyLiving")}
                items={sustainabilityPillItems}
                cta={sustainabilityPillCta}
              />
            </div>
          </div>
          <Footer
            linkGroups={footerLinkGroups}
            featured={footerFeaturedCards}
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
