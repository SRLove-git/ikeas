import Link from "next/link"
import { SiteLayout } from "@/components/SiteLayout"
import { SiteImage } from "@/components/SiteImage"
import { formatPrice } from "@/lib/catalog-format"
import { mideaCatalog, type MideaProduct } from "@/data/midea"
import { getLocale, getServerT } from "@/i18n/server"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Midea Home Appliances",
  description:
    "Midea home appliances available in Singapore with recommended selling prices (incl. GST) taken from each model's launch memo.",
}

function MideaCard({ product }: { product: MideaProduct }) {
  return (
    <Link href={`/zh/midea/p/${product.slug}`} className="group flex flex-col">
      <SiteImage
        src={product.image}
        alt={product.model}
        className="aspect-square w-full bg-white p-5 transition-transform duration-300 group-hover:scale-105"
        imgClassName="h-full w-full object-contain object-center drop-shadow-[0_8px_16px_rgba(17,17,17,0.12)]"
        sizes="(max-width: 639px) calc(50vw - 30px), (max-width: 1023px) calc(33.333vw - 30px), 300px"
      />
      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ikea-muted">
          {product.model}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-ikea-black group-hover:underline">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-bold text-ikea-black">{formatPrice(product.price)}</span>
          {product.originalPrice && product.originalPrice > (product.price ?? 0) ? (
            <span className="text-xs text-ikea-muted line-through">
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export default async function MideaPage() {
  const locale = await getLocale()
  const t = await getServerT(locale)
  const categories = mideaCatalog(locale)

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
          <header className="border-b border-ikea-gray-200 pb-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ikea-muted">
              {t("midea.eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-bold lg:text-4xl">{t("midea.title")}</h1>
            <nav className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <a
                  key={category.slug}
                  href={`#${category.slug}`}
                  className="rounded border border-ikea-gray-200 px-3 py-1.5 text-xs font-bold hover:border-ikea-black"
                >
                  {category.name}
                  <span className="ml-1.5 text-ikea-muted">{category.productCount}</span>
                </a>
              ))}
            </nav>
          </header>

          {categories.map((category) => (
            <section key={category.slug} id={category.slug} className="scroll-mt-24 pt-12">
              <div className="flex items-baseline justify-between gap-4 border-b border-ikea-gray-200 pb-3">
                <h2 className="text-xl font-bold">{category.name}</h2>
                <span className="text-xs text-ikea-muted">
                  {t("midea.modelsSuffix", { count: category.productCount })}
                </span>
              </div>

              {category.subs.map((sub) => (
                <div key={sub.slug} className="pt-6">
                  <h3 className="mb-4 flex items-baseline gap-2 text-sm font-bold text-ikea-black">
                    {sub.name}
                    <span className="text-xs font-normal text-ikea-muted">
                      {sub.products.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                    {sub.products.map((product) => (
                      <MideaCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </SiteLayout>
  )
}
