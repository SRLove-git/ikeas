import Link from "next/link"
import type { ReactNode } from "react"
import { SiteLayout } from "@/components/SiteLayout"
import { SiteImage } from "@/components/SiteImage"
import { ArrowRightIcon } from "@/components/icons"
import { formatPrice } from "@/lib/catalog"
import { catalogPages } from "@/lib/catalog-pages"
import {
  SEARCH_SORTS,
  paginateSearchResults,
  parseSearchSort,
  searchProducts,
  type ProductSearchSort,
  type SearchProduct,
} from "@/lib/product-search"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { getLocale, getServerT } from "@/i18n/server"

export const dynamic = "force-dynamic"

interface SearchQuery {
  q: string
  category: string
  sort: ProductSearchSort
  page: number
}

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "")
}

function buildSearchHref({
  q,
  category,
  sort,
  page,
}: {
  q: string
  category?: string
  sort?: ProductSearchSort
  page?: number
}): string {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (category) params.set("category", category)
  if (sort && sort !== "relevance") params.set("sort", sort)
  if (page && page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `/cn/zh/search/products?${query}` : "/cn/zh/search/products"
}

function highlightMatch(text: string | null | undefined, query: string): ReactNode {
  const value = text ?? ""
  const needle = query.trim()
  if (!needle || !value) return value

  const valueLower = value.toLocaleLowerCase()
  const needleLower = needle.toLocaleLowerCase()
  const index = valueLower.indexOf(needleLower)
  if (index === -1) return value

  return (
    <>
      {value.slice(0, index)}
      <mark className="bg-ikea-yellow/70 text-ikea-black">
        {value.slice(index, index + needle.length)}
      </mark>
      {value.slice(index + needle.length)}
    </>
  )
}

function SearchResultCard({ product, query }: { product: SearchProduct; query: string }) {
  const meta = [
    ...new Set([product.category, product.productType, product.designText].filter(Boolean)),
  ].join(" · ")

  return (
    <Link href={`/cn/zh/p/${product.slug}`} className="group flex flex-col">
      <div className="aspect-square overflow-hidden bg-white">
        <SiteImage
          src={product.image}
          alt={product.name}
          className="h-full w-full p-4"
          imgClassName="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col pt-3">
        {product.labels.length > 0 ? (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {product.labels.slice(0, 2).map((label) => (
              <span
                key={label.text}
                className="inline-block px-1.5 py-0.5 text-[10px] font-bold leading-[10px]"
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
        <h3 className="text-sm font-bold leading-[18px]">{highlightMatch(product.name, query)}</h3>
        {meta ? (
          <p className="mt-0.5 text-xs leading-[18px] text-ikea-muted">
            {highlightMatch(meta, query)}
          </p>
        ) : null}
        <p className="mt-1.5 text-sm text-ikea-black">
          {formatPrice(product.price)}
          {product.originalPrice != null ? (
            <span className="ml-2 text-xs text-ikea-muted line-through">
              {formatPrice(product.originalPrice)}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  )
}

export default async function SearchProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    sort?: string | string[]
    page?: string | string[]
  }>
}) {
  const rawParams = await searchParams
  const locale = await getLocale()
  const t = await getServerT(locale)
  const q = firstParam(rawParams.q)
  const requestedCategory = firstParam(rawParams.category)
  const sort = parseSearchSort(firstParam(rawParams.sort))
  const requestedPage = Math.max(1, Number.parseInt(firstParam(rawParams.page) || "1", 10) || 1)

  const keyword = q.trim()
  const categories = catalogPages(locale).flatMap((page) =>
    page.id ? [{ id: page.id, name: page.name }] : [],
  )
  const results = keyword
    ? searchProducts(
        keyword,
        {
          categorySlug: requestedCategory || undefined,
          sort,
        },
        locale,
      )
    : []
  const pagination = paginateSearchResults(results, requestedPage)
  const activeCategory = categories.find((category) => category.id === requestedCategory)

  const queryForLinks: SearchQuery = {
    q: keyword,
    category: requestedCategory,
    sort,
    page: pagination.page,
  }

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <Breadcrumbs currentLabel={t("search.breadcrumb")} className="mb-8" />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold leading-tight lg:text-4xl">
                {keyword ? t("search.titleKeyword", { q }) : t("search.titlePlaceholder")}
              </h1>
              <p className="mt-2 text-sm text-ikea-muted">
                {keyword
                  ? activeCategory
                    ? t("search.resultCountInCategory", {
                        category: activeCategory.name,
                        count: pagination.total,
                      })
                    : t("search.resultCount", { count: pagination.total })
                  : t("search.inputHint")}
              </p>
            </div>

            {keyword && results.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="mr-1 text-ikea-muted">{t("search.sortBy")}</span>
                {SEARCH_SORTS.map((item) => (
                  <Link
                    key={item.value}
                    href={buildSearchHref({
                      q: keyword,
                      category: requestedCategory,
                      sort: item.value,
                      page: 1,
                    })}
                    className={`i-pill i-pill--small ${
                      sort === item.value ? "i-pill--active" : ""
                    }`}
                  >
                    {t(`search.sort.${item.value}`)}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <form
            role="search"
            className="mt-8 flex items-center gap-4 border-b border-ikea-gray-200 pb-3"
            action="/cn/zh/search/products"
          >
            <input
              name="q"
              defaultValue={q}
              autoFocus={!keyword}
              aria-label={t("search.aria")}
              placeholder={t("search.placeholderExtended")}
              className="h-12 min-w-0 flex-1 bg-transparent text-lg font-bold text-ikea-black outline-none placeholder:text-ikea-gray-200"
            />
            {requestedCategory ? (
              <input type="hidden" name="category" value={requestedCategory} />
            ) : null}
            {sort !== "relevance" ? <input type="hidden" name="sort" value={sort} /> : null}
            <button
              type="submit"
              aria-label={t("search.submit")}
              className="flex h-12 shrink-0 items-center justify-center rounded-full border border-ikea-blue px-12 text-ikea-blue transition-colors hover:bg-ikea-gray-100"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </form>

          {keyword && categories.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-bold text-ikea-muted">
                {t("search.categoryLabel")}
              </span>
              <Link
                href={buildSearchHref({ q: keyword, sort, page: 1 })}
                className={`i-pill i-pill--small ${!requestedCategory ? "i-pill--active" : ""}`}
              >
                {t("search.all")}
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={buildSearchHref({
                    q: keyword,
                    category: category.id,
                    sort,
                    page: 1,
                  })}
                  className={`i-pill i-pill--small ${
                    requestedCategory === category.id ? "i-pill--active" : ""
                  }`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}

          {keyword ? (
            <>
              {pagination.items.length > 0 ? (
                <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
                  {pagination.items.map((product) => (
                    <SearchResultCard key={product.id} product={product} query={keyword} />
                  ))}
                </div>
              ) : (
                <div className="mx-auto mt-20 max-w-xl text-center">
                  <p className="text-2xl font-bold">{t("search.noResults")}</p>
                  <p className="mt-3 text-sm text-ikea-muted">
                    {t("search.noResultsHint", { q })}
                  </p>
                  {activeCategory ? (
                    <div className="mt-6">
                      <Link
                        href={buildSearchHref({ q: keyword, sort, page: 1 })}
                        className="i-pill i-pill--small"
                      >
                        {t("search.clearCategory")}
                      </Link>
                    </div>
                  ) : null}
                </div>
              )}

              {pagination.totalPages > 1 ? (
                <nav
                  aria-label={t("search.paginationAria")}
                  className="mt-14 flex flex-wrap items-center justify-center gap-2"
                >
                  {pagination.page > 1 ? (
                    <Link
                      href={buildSearchHref({
                        ...queryForLinks,
                        page: pagination.page - 1,
                      })}
                      className="i-pill i-pill--small"
                    >
                      {t("search.prev")}
                    </Link>
                  ) : (
                    <span className="i-pill i-pill--small opacity-40">{t("search.prev")}</span>
                  )}
                  {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map(
                    (page) => (
                      <Link
                        key={page}
                        href={buildSearchHref({ ...queryForLinks, page })}
                        aria-current={page === pagination.page ? "page" : undefined}
                        className={`i-pill i-pill--small ${
                          page === pagination.page ? "i-pill--active" : ""
                        }`}
                      >
                        {page}
                      </Link>
                    ),
                  )}
                  {pagination.page < pagination.totalPages ? (
                    <Link
                      href={buildSearchHref({
                        ...queryForLinks,
                        page: pagination.page + 1,
                      })}
                      className="i-pill i-pill--small"
                    >
                      {t("search.next")}
                    </Link>
                  ) : (
                    <span className="i-pill i-pill--small opacity-40">{t("search.next")}</span>
                  )}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-20 text-center">
              <p className="text-sm text-ikea-muted">{t("search.inputHint")}</p>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}
