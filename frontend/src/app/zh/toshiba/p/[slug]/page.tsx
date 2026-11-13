import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SiteLayout } from "@/components/SiteLayout"
import { SiteImage } from "@/components/SiteImage"
import { ProductGallery } from "@/components/ProductGallery"
import { ProductActions } from "@/components/ProductActions"
import { BrowsingHistoryTracker } from "@/components/BrowsingHistoryTracker"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { formatPrice } from "@/lib/catalog-format"
import { allToshibaProducts, toshibaCatalog, toshibaProductBySlug } from "@/data/toshiba"
import { getLocale, getServerT } from "@/i18n/server"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getLocale()
  const product = toshibaProductBySlug(slug, locale)
  if (!product) return {}
  return {
    title: `${product.name} ${product.model}`,
    description: product.detail.description ?? `${product.name} ${product.model}`,
    alternates: { canonical: `/zh/toshiba/p/${product.slug}/` },
    openGraph: product.image ? { images: [product.image] } : undefined,
  }
}

export default async function ToshibaProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getServerT(locale)
  const product = toshibaProductBySlug(slug, locale)
  if (!product) notFound()

  const category = toshibaCatalog(locale).find((item) => item.slug === product.categorySlug)
  const sub = category?.subs.find((item) => item.slug === product.subSlug)
  const related = allToshibaProducts(locale)
    .filter((item) => item.id !== product.id && item.subSlug === product.subSlug)
    .slice(0, 4)

  const specs: { label: string; value: string }[] = [
    { label: t("toshiba.modelLabel"), value: product.model },
    { label: t("toshiba.capacity"), value: product.detail.capacity ?? "" },
    { label: t("toshiba.dimension"), value: product.detail.dimension ?? "" },
    { label: t("toshiba.energy"), value: product.detail.energy ?? "" },
  ].filter((spec) => spec.value)

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <BrowsingHistoryTracker productId={product.id} />
          <Breadcrumbs currentLabel={product.name} className="mb-4" />

          <div className="grid gap-10 lg:grid-cols-2">
            <ProductGallery
              images={product.detail.images.length > 0 ? product.detail.images : [product.image]}
              name={product.name}
            />

            <div className="flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ikea-muted">
                {category?.name ?? "Toshiba"}
                {sub ? ` · ${sub.name}` : ""}
              </p>
              <h1 className="mt-2 text-2xl font-bold leading-8 lg:text-3xl">{product.name}</h1>
              <p className="mt-2 text-sm text-ikea-muted">
                {t("toshiba.model", { model: product.model })}
              </p>

              <ProductActions
                productId={product.id}
                product={{
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  originalPrice: product.originalPrice,
                  image: product.image,
                  productType: `Toshiba · ${product.model}`,
                }}
              />
              <p className="mt-2 text-xs text-ikea-muted">{t("toshiba.priceNote")}</p>

              <dl className="mt-8 divide-y divide-ikea-gray-200 border-y border-ikea-gray-200 text-sm">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex gap-4 py-3">
                    <dt className="w-40 shrink-0 text-ikea-muted">{spec.label}</dt>
                    <dd className="break-all">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-sm leading-6 text-ikea-muted">{product.detail.description}</p>

              <Link
                href="/zh/toshiba/"
                className="mt-3 text-sm font-bold text-ikea-blue hover:underline"
              >
                {t("toshiba.backAll")}
              </Link>
            </div>
          </div>

          {related.length > 0 ? (
            <section className="mt-16">
              <h2 className="border-b border-ikea-gray-200 pb-3 text-xl font-bold">
                {t("toshiba.related")}
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/zh/toshiba/p/${item.slug}`}
                    className="group flex flex-col"
                  >
                    <SiteImage
                      src={item.image}
                      alt={item.model}
                      className="aspect-square w-full bg-white p-5"
                      imgClassName="h-full w-full object-contain object-center"
                      sizes="(max-width: 639px) calc(50vw - 30px), (max-width: 1023px) calc(33.333vw - 30px), 300px"
                    />
                    <p className="pt-3 text-[11px] font-bold uppercase tracking-wide text-ikea-muted">
                      {item.model}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5 group-hover:underline">
                      {item.name}
                    </h3>
                    <span className="mt-2 text-sm font-bold">{formatPrice(item.price)}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </SiteLayout>
  )
}
