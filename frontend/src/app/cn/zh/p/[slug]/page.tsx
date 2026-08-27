import { notFound } from "next/navigation"
import Link from "next/link"
import { catalogData } from "@/data/catalog"
import { findProductBySlug, formatPrice } from "@/lib/catalog"
import { ProductGallery } from "@/components/ProductGallery"
import { ProductActions } from "@/components/ProductActions"
import { ProductCard } from "@/components/ProductCard"
import { SiteLayout } from "@/components/SiteLayout"
import { BrowsingHistoryTracker } from "@/components/BrowsingHistoryTracker"
import { allProducts } from "@/data/products-index"
import type { CatalogProduct } from "@/data/catalog"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { getLocale, getServerT } from "@/i18n/server"

export const dynamicParams = false

export function generateStaticParams() {
  const slugs = new Set<string>()
  const { catalogCategories, channelCategories } = catalogData()
  for (const category of [...catalogCategories, ...channelCategories]) {
    for (const product of category.products) slugs.add(product.slug)
  }
  for (const product of allProducts()) slugs.add(product.slug)
  return [...slugs].map((slug) => ({ slug }))
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const t = await getServerT(locale)
  const match = findProductBySlug(slug, locale)
  if (!match) notFound()

  const { product } = match
  const detail = product.detail
  const spec = [product.productType, product.designText].filter(Boolean).join(", ")
  const similar: CatalogProduct[] = allProducts(locale)
    .filter(
      (candidate) => candidate.id !== product.id && candidate.productType === product.productType,
    )
    .slice(0, 4)
    .map((candidate) => ({
      id: candidate.id,
      slug: candidate.slug,
      name: candidate.name,
      productType: candidate.productType ?? undefined,
      designText: candidate.designText ?? undefined,
      price: candidate.price,
      originalPrice: null,
      image: candidate.image,
      labels: (candidate.labels ?? []).map((label) => ({
        text: label.text,
        backgroundColor: label.backgroundColor ?? undefined,
        textColor: label.textColor ?? undefined,
      })),
      detail: {
        images: candidate.detail?.images ?? [],
        benefits: candidate.detail?.benefits ?? [],
        dimension: candidate.detail?.dimension ?? null,
        materials: candidate.detail?.materials ?? [],
        care: candidate.detail?.care ?? [],
        description: candidate.detail?.description ?? null,
      },
    }))

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <BrowsingHistoryTracker productId={product.id} />
          <Breadcrumbs currentLabel={product.name} className="mb-4" />

          <div className="grid gap-10 lg:grid-cols-2">
            <ProductGallery images={detail?.images ?? []} name={product.name} />

            <div className="flex flex-col">
              {product.labels.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {product.labels.map((label) => (
                    <span
                      key={label.text}
                      className="inline-block px-2 py-1 text-[11px] font-bold leading-[11px]"
                      style={{
                        backgroundColor: label.backgroundColor ?? "#111111",
                        color: label.textColor ?? "#ffffff",
                      }}
                    >
                      {label.text}
                    </span>
                  ))}
                </div>
              ) : null}

              <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{product.name}</h1>
              {spec ? <p className="mt-1 text-sm text-ikea-muted">{spec}</p> : null}

              <p className="mt-5 text-2xl font-bold">{formatPrice(product.price)}</p>
              <p className="mt-2 text-sm text-ikea-muted">
                {t("product.itemNumber", { id: product.id })}
              </p>

              <ProductActions productId={product.id} product={product} />

              <div className="mt-6 space-y-1.5 text-xs leading-5 text-ikea-muted">
                <p>{t("product.stockNote")}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link
                    href="/cn/zh/customer-service/services/delivery/"
                    className="font-bold text-ikea-blue hover:underline"
                  >
                    {t("product.deliveryLink")}
                  </Link>
                  <Link
                    href="/cn/zh/customer-service/services/aftersales/"
                    className="font-bold text-ikea-blue hover:underline"
                  >
                    {t("product.returnsWarrantyLink")}
                  </Link>
                </div>
              </div>

              {detail && detail.benefits.length > 0 ? (
                <ul className="mt-8 space-y-2">
                  {detail.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2 text-sm leading-6">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ikea-blue" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {detail ? (
            <div className="mt-14 grid gap-8 border-t border-ikea-gray-200 pt-10 md:grid-cols-2 lg:grid-cols-4">
              {detail.intendedFor ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.intendedFor")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.intendedFor}</p>
                </section>
              ) : null}
              {detail.packageCount ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.packageCount")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.packageCount}</p>
                </section>
              ) : null}
              {detail.description ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.description")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.description}</p>
                </section>
              ) : null}
              {detail.dimension ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("common.dimension")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.dimension}</p>
                </section>
              ) : null}
              {detail.materials.length > 0 ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("common.materials")}</h2>
                  <ul className="space-y-1 text-sm leading-6 text-ikea-muted">
                    {detail.materials.map((material) => (
                      <li key={material}>· {material}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {detail.care.length > 0 ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.careInstructions")}</h2>
                  <ul className="space-y-1 text-sm leading-6 text-ikea-muted">
                    {detail.care.map((care) => (
                      <li key={care}>· {care}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {detail.usage ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.usage")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.usage}</p>
                </section>
              ) : null}
              {detail.resultReading ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.resultReading")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.resultReading}</p>
                </section>
              ) : null}
              {detail.precautions ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.precautions")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.precautions}</p>
                </section>
              ) : null}
              {detail.storage ? (
                <section>
                  <h2 className="mb-3 text-base font-bold">{t("product.storage")}</h2>
                  <p className="text-sm leading-6 text-ikea-muted">{detail.storage}</p>
                </section>
              ) : null}
            </div>
          ) : null}

          {similar.length > 0 ? (
            <div className="mt-14 border-t border-ikea-gray-200 pt-10">
              <h2 className="text-xl font-bold">
                {t("product.similar", { name: product.name })}
              </h2>
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {similar.map((candidate) => (
                  <ProductCard key={candidate.id} product={candidate} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </SiteLayout>
  )
}
