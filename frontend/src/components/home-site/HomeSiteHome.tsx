import Link from "next/link"
import { SiteLayout } from "@/components/SiteLayout"
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
  const heroProducts = data.featured.slice(0, 2)

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <section className="mx-auto max-w-page pt-5 lg:pt-7">
          <div className="relative overflow-hidden rounded-[28px] bg-[#f3efe9]">
            <div className="grid min-h-[610px] lg:min-h-[520px] lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative z-10 flex flex-col items-start justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ikea-muted">
                  {isZh ? "家庭生活 · 东芝 × 美的" : "Home & Living · Toshiba × Midea"}
                </p>
                <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                  {isZh ? "让好家电，成为家的日常" : "Appliances that make home feel effortless"}
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-ikea-muted">
                  {isZh
                    ? "冰箱、洗护、厨房与清洁电器，官方渠道正品保障，全岛配送与安装支持。"
                    : "Refrigeration, laundry, kitchen and cleaning appliances — genuine products, islandwide delivery and installation support."}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/zh/all-products/"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-ikea-black px-7 text-sm font-bold text-white transition-colors hover:bg-[#333333]"
                  >
                    {isZh ? "选购全部家电" : "Shop all appliances"}
                  </Link>
                  <Link
                    href="/zh/toshiba/"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-ikea-black px-6 text-sm font-bold text-ikea-black transition-colors hover:bg-white/60"
                  >
                    Toshiba
                  </Link>
                  <Link
                    href="/zh/midea/"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-ikea-black px-6 text-sm font-bold text-ikea-black transition-colors hover:bg-white/60"
                  >
                    Midea
                  </Link>
                </div>
                <p className="mt-6 text-xs font-bold tracking-[0.04em] text-ikea-muted">
                  {isZh
                    ? "官方正品 · 全岛配送 · 安装与售后支持"
                    : "Genuine · Islandwide delivery · Installation & support"}
                </p>
              </div>
              <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
                {heroProducts.map((product, index) => (
                  <SiteImage
                    key={product.id}
                    src={product.image}
                    alt={product.name}
                    className={`absolute bg-transparent ${
                      index === 0
                        ? "right-[32%] bottom-0 h-[92%] w-[58%]"
                        : "-right-[5%] bottom-[-3%] h-[72%] w-[52%]"
                    }`}
                    imgClassName="h-full w-full object-contain object-bottom drop-shadow-[0_24px_38px_rgba(17,17,17,0.18)]"
                    sizes="(max-width: 1023px) 55vw, 420px"
                    loading="eager"
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                ))}
                <span className="absolute right-5 bottom-5 rounded-full bg-white/85 px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-ikea-black backdrop-blur sm:right-8 sm:bottom-8">
                  TOSHIBA × MIDEA
                </span>
              </div>
            </div>
          </div>
        </section>

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
                  <span className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-ikea-black px-6 text-xs font-bold text-white">
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
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
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
            <a
              href={MEDICAL_URL}
              className="inline-flex h-10 items-center justify-center rounded-full border border-ikea-black px-6 text-xs font-bold text-ikea-black transition-colors hover:bg-ikea-gray-100"
            >
              {isZh ? "前往医疗健康站 medical-sg.com" : "Visit medical-sg.com"}
            </a>
          </div>
        </section>
      </div>
    </SiteLayout>
  )
}
