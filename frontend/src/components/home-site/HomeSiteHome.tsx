import { HeroVideo } from "@/components/HeroVideo"
import { InspirationTipsCard } from "@/components/InspirationTipsCard"
import { PromoInspirationCard } from "@/components/PromoInspirationCard"
import { SiteLayout } from "@/components/SiteLayout"
import { VisualPillSlider } from "@/components/VisualPillSlider"
import { homeSiteData } from "@/data/home-site"
import { getLocale } from "@/i18n/server"
import { formatPrice } from "@/lib/catalog-format"
import { productHref } from "@/lib/product-url"
import { getSiteIntro } from "@/lib/site-intro"
import { PORTAL_URL } from "@/lib/site-scope"
import type { PillSliderItem, PromoTile } from "@/types"

const tileColors = ["#dcebe7", "#dbe6ef", "#f3e5dc"] as const

/**
 * home-sg.com keeps its Toshiba / Midea catalogue content while sharing the
 * same homepage hierarchy and reusable UI components as medical-sg.com.
 */
export async function HomeSiteHome() {
  const locale = await getLocale()
  const data = homeSiteData(locale)
  const isZh = locale === "zh-CN"
  const intro = getSiteIntro("home")[isZh ? "zh" : "en"]

  const promoItems: PromoTile[] = [
    ...data.brands.map((brand, index) => ({
      title: brand.name,
      description: isZh
        ? `${brand.tagline} · ${brand.count} 款在售`
        : `${brand.tagline} · ${brand.count} products`,
      href: brand.href,
      image: brand.image ?? undefined,
      backgroundColor: tileColors[index] ?? tileColors[0],
      textColor: "#111111",
    })),
    {
      title: isZh ? "全部家电" : "All appliances",
      description: isZh
        ? `${data.totalProducts} 款东芝与美的家电`
        : `${data.totalProducts} Toshiba and Midea appliances`,
      href: "/zh/all-products/",
      image: data.featured[0]?.image ?? undefined,
      backgroundColor: tileColors[2],
      textColor: "#111111",
    },
  ]

  const categoryItems: PillSliderItem[] = data.categories.map((category) => ({
    label: category.label,
    href: category.href,
    image: category.image ?? undefined,
  }))

  const featuredItems: PromoTile[] = data.featured.slice(0, 3).map((product, index) => ({
    title: product.name,
    description: [product.productType, product.model, formatPrice(product.price)]
      .filter(Boolean)
      .join(" · "),
    ctaLabel: isZh ? "查看详情" : "View product",
    href: productHref(product),
    image: product.image ?? undefined,
    backgroundColor: tileColors[index] ?? tileColors[0],
    textColor: "#111111",
  }))

  const popularItems: PillSliderItem[] = data.featured.slice(3).map((product) => ({
    label: product.name,
    href: productHref(product),
    image: product.image ?? undefined,
  }))

  return (
    <SiteLayout locale={locale}>
      <div className="i-layout__body">
        <section className="mx-auto max-w-page pt-5 lg:pt-7">
          <div className="flex flex-col gap-5 border-b border-ikea-gray-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ikea-muted">
                {intro.eyebrow}
              </p>
              <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {intro.title}
              </h1>
            </div>
            <div className="max-w-lg md:text-right">
              <p className="text-sm leading-6 text-ikea-muted">{intro.description}</p>
              <a
                href={PORTAL_URL}
                className="mt-3 inline-flex text-xs font-bold text-ikea-black underline decoration-1 underline-offset-4 hover:text-ikea-blue"
              >
                {isZh ? "返回 CHUNG YIP 总入口 →" : "Back to CHUNG YIP portal →"}
              </a>
            </div>
          </div>
        </section>

        <HeroVideo items={data.heroVideos} />

        <div className="clearfix m-auto mt-4 mb-8 min-h-screen max-w-page space-y-8 px-0 text-left lg:mt-6 lg:mb-12 lg:space-y-12">
          <PromoInspirationCard
            title={isZh ? "CHUNG YIP 精选" : "CHUNG YIP Picks"}
            items={promoItems}
          />
          <VisualPillSlider
            title={isZh ? "按空间挑选" : "Shop by category"}
            items={categoryItems}
            cta={{
              label: isZh ? "查看全部家电" : "Browse all appliances",
              href: "/zh/all-products/",
              color: "#0058a3",
              textColor: "#ffffff",
            }}
          />
          <InspirationTipsCard
            title={isZh ? "本周精选" : "Featured this week"}
            items={featuredItems}
          />
          <VisualPillSlider
            title={isZh ? "家电精选" : "Home appliance picks"}
            items={popularItems}
            cta={{
              label: isZh ? "选购所有家电" : "Shop all appliances",
              href: "/zh/all-products/",
              color: "#111111",
              textColor: "#ffffff",
            }}
          />
        </div>
      </div>
    </SiteLayout>
  )
}
