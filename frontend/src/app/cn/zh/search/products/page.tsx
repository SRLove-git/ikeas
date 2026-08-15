import Link from "next/link"
import type { ReactNode } from "react"
import { SiteLayout } from "@/components/SiteLayout"
import { SiteImage } from "@/components/SiteImage"
import { formatPrice } from "@/lib/catalog"
import { catalogPages } from "@/lib/catalog-pages"
import { homepage } from "@/data/homepage"
import {
  SEARCH_SORTS,
  paginateSearchResults,
  parseSearchSort,
  searchProducts,
  type ProductSearchSort,
  type SearchProduct,
} from "@/lib/product-search"

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
    <Link
      href={`/cn/zh/p/${product.slug}`}
      className="group flex flex-col rounded-sm p-1 transition-colors hover:bg-ikea-gray-100"
    >
      <SiteImage
        src={product.image}
        alt={product.name}
        className="aspect-square w-full bg-white transition-transform duration-300 group-hover:scale-105"
        imgClassName="h-full w-full object-contain object-[50%_20%]"
      />
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
        <p className="mt-1.5 text-sm text-ikea-black">{formatPrice(product.price)}</p>
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
  const q = firstParam(rawParams.q)
  const requestedCategory = firstParam(rawParams.category)
  const sort = parseSearchSort(firstParam(rawParams.sort))
  const requestedPage = Math.max(1, Number.parseInt(firstParam(rawParams.page) || "1", 10) || 1)

  const keyword = q.trim()
  const categories = catalogPages().flatMap((page) =>
    page.id ? [{ id: page.id, name: page.name }] : [],
  )
  const searchHints = homepage().searchHints
  const results = keyword
    ? searchProducts(keyword, {
        categorySlug: requestedCategory || undefined,
        sort,
      })
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
          <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
            <Link href="/" className="hover:text-ikea-black">
              首页
            </Link>
            <span>/</span>
            <span className="text-ikea-black">搜索</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">
            {keyword ? `搜索“${q}”` : "搜索商品"}
          </h1>

          <form role="search" className="mt-6 flex max-w-2xl gap-3" action="/cn/zh/search/products">
            <input
              name="q"
              defaultValue={q}
              autoFocus={!keyword}
              aria-label="搜索商品"
              placeholder="搜索商品、系列或品类"
              className="h-11 min-w-0 flex-1 border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
            />
            {requestedCategory ? (
              <input type="hidden" name="category" value={requestedCategory} />
            ) : null}
            {sort !== "relevance" ? <input type="hidden" name="sort" value={sort} /> : null}
            <button
              type="submit"
              className="i-btn i-btn--primary h-11 shrink-0 px-8 text-sm font-bold text-white"
            >
              搜索
            </button>
          </form>

          {keyword && categories.length > 0 ? (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-ikea-muted">分类：</span>
              <Link
                href={buildSearchHref({ q: keyword, sort, page: 1 })}
                className={`i-pill i-pill--small ${!requestedCategory ? "i-pill--active" : ""}`}
              >
                全部
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
              <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
                <p className="text-sm text-ikea-muted">
                  {activeCategory ? `在“${activeCategory.name}”分类下` : ""}
                  共找到 {pagination.total} 件相关商品
                </p>

                {results.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-ikea-muted">排序：</span>
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
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              {pagination.items.length > 0 ? (
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                  {pagination.items.map((product) => (
                    <SearchResultCard key={product.id} product={product} query={keyword} />
                  ))}
                </div>
              ) : (
                <div className="mt-16 text-center">
                  <p className="text-sm text-ikea-muted">
                    没有找到与“{q}”相关的商品，试试其他关键词。
                  </p>
                  {activeCategory ? (
                    <div className="mt-6">
                      <Link
                        href={buildSearchHref({ q: keyword, sort, page: 1 })}
                        className="i-pill i-pill--small"
                      >
                        清除分类筛选
                      </Link>
                    </div>
                  ) : null}
                  {searchHints.length > 0 ? (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {searchHints.map((suggestion) => (
                        <Link
                          key={suggestion}
                          href={buildSearchHref({ q: suggestion, page: 1 })}
                          className="i-pill i-pill--small"
                        >
                          {suggestion}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {pagination.totalPages > 1 ? (
                <nav
                  aria-label="搜索结果分页"
                  className="mt-12 flex flex-wrap items-center justify-center gap-2"
                >
                  {pagination.page > 1 ? (
                    <Link
                      href={buildSearchHref({
                        ...queryForLinks,
                        page: pagination.page - 1,
                      })}
                      className="i-pill i-pill--small"
                    >
                      上一页
                    </Link>
                  ) : (
                    <span className="i-pill i-pill--small opacity-40">上一页</span>
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
                      下一页
                    </Link>
                  ) : (
                    <span className="i-pill i-pill--small opacity-40">下一页</span>
                  )}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-16 text-center text-sm text-ikea-muted">
              <p>输入关键词，搜索 BUZUD 商品</p>
              {searchHints.length > 0 ? (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {searchHints.map((suggestion) => (
                    <Link
                      key={suggestion}
                      href={buildSearchHref({ q: suggestion, page: 1 })}
                      className="i-pill i-pill--small"
                    >
                      {suggestion}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  )
}
