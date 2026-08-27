import Link from "next/link"
import { notFound } from "next/navigation"
import { catalogData } from "@/data/catalog"
import { findCategoryBySlug } from "@/lib/catalog"
import { ProductCard } from "@/components/ProductCard"
import { SiteImage } from "@/components/SiteImage"
import { catalogPages, findCatalogPageBySlug, productHref } from "@/lib/catalog-pages"
import { productSlugsWithDetails } from "@/lib/catalog"
import { formatPrice } from "@/lib/catalog-format"
import { ContentBlocks } from "@/components/ContentBlocks"
import { SiteLayout } from "@/components/SiteLayout"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { allProducts } from "@/data/products-index"
import { getLocale, getServerT } from "@/i18n/server"

export const dynamicParams = false

export function generateStaticParams() {
  const params: { slug: string }[] = []
  const seen = new Set<string>()
  const { catalogCategories } = catalogData()
  for (const category of catalogCategories) {
    if (!seen.has(category.slug)) {
      seen.add(category.slug)
      params.push({ slug: category.slug })
    }
    for (const sub of category.subs) {
      if (!seen.has(sub.slug)) {
        seen.add(sub.slug)
        params.push({ slug: sub.slug })
      }
    }
  }
  for (const page of catalogPages()) {
    const slug = page.url.split("/").filter(Boolean).at(-1) ?? ""
    if (slug && !seen.has(slug)) {
      seen.add(slug)
      params.push({ slug })
    }
  }
  return params
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; type?: string }>
}) {
  const { slug } = await params
  const { sort: rawSort, type: rawType } = await searchParams
  const locale = await getLocale()
  const t = await getServerT(locale)
  const match = findCategoryBySlug(slug, locale)
  const hrefFor = (sort: string | undefined, type: string | null) => {
    const params = new URLSearchParams()
    if (sort) params.set("sort", sort)
    if (type) params.set("type", type)
    const query = params.toString()
    return query ? `/cn/zh/cat/${slug}?${query}` : `/cn/zh/cat/${slug}`
  }

  if (match) {
    const { category, sub } = match
    const title = sub?.name ?? category.name
    const products = [...category.products]
    const types = [...new Set(products.map((p) => p.productType).filter(Boolean))] as string[]
    const landingPage = findCatalogPageBySlug(slug, locale)
    const suggestions = allProducts(locale).slice(0, 4)

    const sort = rawSort === "priceAsc" || rawSort === "priceDesc" || rawSort === "nameAsc" ? rawSort : null
    const activeType = rawType && types.includes(rawType) ? rawType : null
    const filtered = activeType ? products.filter((p) => p.productType === activeType) : products
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "priceAsc") return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER)
      if (sort === "priceDesc") return (b.price ?? Number.MIN_SAFE_INTEGER) - (a.price ?? Number.MIN_SAFE_INTEGER)
      if (sort === "nameAsc") return a.name.localeCompare(b.name, locale === "en" ? "en" : "zh-CN")
      return 0
    })

    const emptyState = sorted.length === 0 ? (
      <div className="mt-8 rounded border border-ikea-gray-200 bg-ikea-gray-50 px-6 py-10 text-center">
        <p className="text-sm font-bold">{t("category.emptyTitle")}</p>
        <p className="mt-2 text-sm text-ikea-muted">{t("category.emptyBody")}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/cn/zh/all-products/" className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white">
            {t("category.backAllProducts")}
          </Link>
          <Link href="/cn/zh/customer-service/contact-us/" className="i-btn i-btn--secondary flex h-11 items-center justify-center px-8 text-sm font-bold">
            {t("category.contactService")}
          </Link>
        </div>
        <p className="mt-8 text-xs font-bold text-ikea-muted">{t("category.suggestions")}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((product) => (
            <Link key={product.id} href={`/cn/zh/p/${product.slug}/`} className="i-pill i-pill--small">
              {product.name}
            </Link>
          ))}
        </div>
      </div>
    ) : null

    return (
      <SiteLayout>
        <div className="font-ikea min-h-screen bg-white text-ikea-black">
          <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
            <Breadcrumbs currentLabel={title} />

            <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-ikea-muted">
              {t("category.itemsCount", { count: sorted.length })}
            </p>

            {category.subs.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {category.subs.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/cn/zh/cat/${s.slug}`}
                    className={`i-pill i-pill--small ${s.slug === slug ? "i-pill--active" : ""}`}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            ) : null}

            {landingPage?.description ? (
              <p className="mt-5 text-sm leading-6 text-ikea-muted">{landingPage.description}</p>
            ) : null}

            {types.length > 1 ? (
              <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
                <span className="mr-1 text-ikea-muted">{t("category.filterByType")}</span>
                <Link
                  href={hrefFor(sort ?? undefined, null)}
                  className={`i-pill i-pill--small ${!activeType ? "i-pill--active" : ""}`}
                >
                  {t("category.allTypes")}
                </Link>
                {types.map((type) => (
                  <Link
                    key={type}
                    href={hrefFor(sort ?? undefined, type)}
                    className={`i-pill i-pill--small ${activeType === type ? "i-pill--active" : ""}`}
                  >
                    {type}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="mr-1 text-ikea-muted">{t("search.sortBy")}</span>
              <Link
                href={hrefFor(undefined, activeType)}
                className={`i-pill i-pill--small ${!sort ? "i-pill--active" : ""}`}
              >
                {t("search.relevance")}
              </Link>
              {(["priceAsc", "priceDesc", "nameAsc"] as const).map((value) => (
                <Link
                  key={value}
                  href={hrefFor(value, activeType)}
                  className={`i-pill i-pill--small ${sort === value ? "i-pill--active" : ""}`}
                >
                  {t(`search.sort.${value}`)}
                </Link>
              ))}
            </div>

            {landingPage && landingPage.blocks.length > 0 ? (
              <div className="mt-8">
                <ContentBlocks blocks={landingPage.blocks} />
              </div>
            ) : null}

            {emptyState ?? (
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {sorted.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </SiteLayout>
    )
  }

  const page = findCatalogPageBySlug(slug)
  if (!page) notFound()
  const suggestions = allProducts(locale).slice(0, 4)

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <Breadcrumbs currentLabel={page.name} />

          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{page.name}</h1>
          {page.description ? (
            <p className="mt-2 text-sm leading-6 text-ikea-muted">{page.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-ikea-muted">共 {page.total} 件商品</p>

          {page.blocks.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {page.blocks
                .flatMap((b) => b.links)
                .slice(0, 12)
                .map((link, i) => (
                  <Link key={`${link.href}-${i}`} href={link.href} className="i-pill i-pill--small">
                    {link.text || "查看"}
                  </Link>
                ))}
            </div>
          ) : null}

          {page.products.length === 0 ? (
            <div className="mt-8 rounded border border-ikea-gray-200 bg-ikea-gray-50 px-6 py-10 text-center">
              <p className="text-sm font-bold">{t("category.emptyTitle")}</p>
              <p className="mt-2 text-sm text-ikea-muted">{t("category.emptyBody")}</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/cn/zh/all-products/"
                  className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white"
                >
                  {t("category.backAllProducts")}
                </Link>
                <Link
                  href="/cn/zh/customer-service/contact-us/"
                  className="i-btn i-btn--secondary flex h-11 items-center justify-center px-8 text-sm font-bold"
                >
                  {t("category.contactService")}
                </Link>
              </div>
              <p className="mt-8 text-xs font-bold text-ikea-muted">{t("category.suggestions")}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/cn/zh/p/${product.slug}/`}
                    className="i-pill i-pill--small"
                  >
                    {product.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {page.products.map((product) => {
                const href = productHref(product)
                const hasDetail = productSlugsWithDetails().has(
                  href.split("/").filter(Boolean).at(-1) ?? "",
                )
                const content = (
                  <>
                    <div className="aspect-square w-full overflow-hidden bg-white">
                      <SiteImage
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full p-4"
                        imgClassName="h-full w-full object-contain object-center"
                      />
                    </div>
                    <div className="flex flex-1 flex-col pt-3">
                      <h3 className="line-clamp-2 min-h-[36px] text-sm font-bold leading-[18px] text-ikea-black">
                        {product.name}
                      </h3>
                      {product.measureText || product.designText ? (
                        <p className="mt-0.5 line-clamp-1 text-xs leading-[18px] text-ikea-muted">
                          {product.measureText || product.designText}
                        </p>
                      ) : (
                        <p className="mt-0.5 h-[18px] text-xs leading-[18px] text-ikea-muted" />
                      )}
                      <p className="mt-auto pt-1.5 text-sm text-ikea-black">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </>
                )
                return hasDetail ? (
                  <Link key={product.id} href={href} className="group flex flex-col">
                    {content}
                  </Link>
                ) : (
                  <div key={product.id} className="flex flex-col">
                    {content}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}
