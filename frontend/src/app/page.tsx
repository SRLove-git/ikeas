import type { Metadata } from "next"
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
import { SITE_SCOPE, isAppliancePath } from "@/lib/site-scope"
import { getSiteIntro } from "@/lib/site-intro"
import { PORTAL_LOCALE_PATHS } from "@/i18n/config"
import { getLocale, getServerT } from "@/i18n/server"

const showExperienceBooking = process.env.NEXT_PUBLIC_SHOW_EXPERIENCE_BOOKING === "true"

export async function generateMetadata(): Promise<Metadata> {
  if (SITE_SCOPE !== "portal") return {}

  const locale = await getLocale()
  const isZh = locale === "zh-CN"
  const intro = getSiteIntro("portal")[isZh ? "zh" : "en"]
  const pathname = isZh ? PORTAL_LOCALE_PATHS["zh-CN"] : PORTAL_LOCALE_PATHS.en
  const title = `${intro.title} | ${intro.eyebrow}`
  const description = intro.description

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
      languages: {
        en: PORTAL_LOCALE_PATHS.en,
        "zh-CN": PORTAL_LOCALE_PATHS["zh-CN"],
        "x-default": PORTAL_LOCALE_PATHS.en,
      },
    },
    openGraph: {
      type: "website",
      url: pathname,
      title,
      description,
      siteName: "CHUNG YIP",
      locale: isZh ? "zh_SG" : "en_SG",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  }
}

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
              <div className="border-b border-ikea-gray-200 pb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ikea-muted">
                  {isZh ? "医疗健康 · BUZUD" : "Medical & Health · BUZUD"}
                </p>
                <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  {isZh
                    ? "专业健康管理，从家开始"
                    : "Professional health support, closer to home"}
                </h1>
              </div>
            </section>
            <HeroVideo items={heroVideos.filter((item) => !isAppliancePath(item.href ?? ""))} />
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
                  image="/images/products/buzud-8885020711448-1.png"
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
