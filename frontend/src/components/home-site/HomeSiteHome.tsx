import Link from "next/link"
import { SiteLayout } from "@/components/SiteLayout"
import { HeroVideo } from "@/components/HeroVideo"
import { ProductCard } from "@/components/ProductCard"
import { SiteImage } from "@/components/SiteImage"
import { homeSiteData } from "@/data/home-site"
import { getLocale } from "@/i18n/server"
import { MEDICAL_URL } from "@/lib/site-scope"

/**
 * home-sg.com 首页：只展示东芝 / 美的家电。
 * 医疗商品全部由 medical-sg.com 承载，这里不出现任何医疗目录入口。
 */
export async function HomeSiteHome() {
  const locale = await getLocale()
  const data = homeSiteData(locale)
  const isZh = locale === "zh-CN"

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 pt-5 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ikea-gray-200 pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ikea-muted">
                {isZh ? "家庭生活 · 东芝 × 美的" : "Home & Living · Toshiba × Midea"}
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight lg:text-4xl">
                {isZh ? "让好家电，成为家的日常" : "Appliances that make home feel effortless"}
              </h1>
            </div>
            <p className="max-w-md text-sm leading-6 text-ikea-muted">
              {isZh
                ? "冰箱、洗护、厨房与清洁电器，官方渠道正品保障，全岛配送与安装支持。"
                : "Refrigeration, laundry, kitchen and cleaning appliances — genuine products, islandwide delivery and installation support."}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-page px-5 pt-6 lg:px-10">
          <HeroVideo items={[data.hero]} />
        </div>

        <section className="mx-auto max-w-page px-5 py-12 lg:px-10 lg:py-16">
          <div className="grid gap-5 md:grid-cols-2">
            {data.brands.map((brand) => (
              <Link
                key={brand.id}
                href={brand.href}
                className="group relative overflow-hidden rounded-2xl bg-ikea-gray-100 p-6 transition-shadow hover:shadow-lg lg:p-9"
              >
                <div className="relative z-10 max-w-[58%]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ikea-muted">
                    {brand.count} {isZh ? "款在售" : "products"}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold uppercase tracking-tight lg:text-4xl">
                    {brand.name}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ikea-muted">{brand.tagline}</p>
                  <span className="i-btn i-btn--primary mt-6 h-10 px-6 text-xs">
                    {isZh ? `进入 ${brand.name} 专区` : `Shop ${brand.name}`}
                  </span>
                </div>
                <SiteImage
                  src={brand.image}
                  alt={brand.name}
                  className="pointer-events-none absolute -right-6 -bottom-8 h-[78%] w-[52%] bg-transparent"
                  imgClassName="h-full w-full object-contain object-bottom drop-shadow-[0_16px_28px_rgba(17,17,17,0.18)] transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 767px) 50vw, 360px"
                />
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-ikea-gray-100/70 py-12 lg:py-16">
          <div className="mx-auto max-w-page px-5 lg:px-10">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-bold lg:text-3xl">
                {isZh ? "按空间挑选" : "Shop by category"}
              </h2>
              <Link
                href="/zh/all-products/"
                className="text-xs font-bold text-ikea-muted underline-offset-4 hover:text-ikea-black hover:underline"
              >
                {isZh ? "查看全部家电" : "All appliances"}
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {data.categories.map((category) => (
                <Link key={category.label} href={category.href} className="group">
                  <div className="aspect-square overflow-hidden rounded-xl bg-white p-4">
                    <SiteImage
                      src={category.image}
                      alt={category.label}
                      className="h-full w-full bg-transparent"
                      imgClassName="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 639px) 45vw, 180px"
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold group-hover:underline">{category.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-page px-5 py-12 lg:px-10 lg:py-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-bold lg:text-3xl">
              {isZh ? "本周精选" : "Featured this week"}
            </h2>
            <p className="text-xs text-ikea-muted">
              {isZh
                ? `共 ${data.totalProducts} 款家电在售`
                : `${data.totalProducts} appliances available`}
            </p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {data.featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-page px-5 pb-14 lg:px-10">
          <div className="grid gap-4 rounded-2xl bg-ikea-black p-7 text-white md:grid-cols-3 lg:p-10">
            {(isZh
              ? [
                  { title: "官方正品", body: "东芝与美的授权渠道，整机保修按品牌政策执行。" },
                  { title: "全岛配送", body: "新加坡本地配送，大家电可预约送货与安装。" },
                  { title: "售后无忧", body: "统一客服与保修登记，订单状态随时可查。" },
                ]
              : [
                  {
                    title: "Genuine products",
                    body: "Authorised Toshiba and Midea channels with brand warranty.",
                  },
                  {
                    title: "Islandwide delivery",
                    body: "Local delivery with scheduled installation for large appliances.",
                  },
                  {
                    title: "After-sales support",
                    body: "One support team, warranty registration and live order tracking.",
                  },
                ]
            ).map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-ikea-gray-200 pt-8 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-ikea-muted">
              {isZh
                ? "也在寻找健康检测与医疗设备？"
                : "Also looking for health testing and medical devices?"}
            </p>
            <a href={MEDICAL_URL} className="i-btn i-btn--secondary h-10 px-6 text-xs">
              {isZh ? "前往医疗健康站 medical-sg.com" : "Visit medical-sg.com"}
            </a>
          </div>
        </section>
      </div>
    </SiteLayout>
  )
}
