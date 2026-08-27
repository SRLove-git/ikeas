import { allProducts, productsBySlug } from "@/data/products-index"
import { catalogData } from "@/data/catalog"
import { getMenuCategories } from "@/data/categories"
import { catalogPages } from "@/lib/catalog-pages"
import type { ProductData } from "@/data/pages-types"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

export type ProductSearchSort = "relevance" | "priceAsc" | "priceDesc" | "nameAsc"

export interface SearchProduct extends ProductData {
  originalPrice?: number | null
  category: string | null
  categorySlug: string | null
  score: number
}

interface ProductSearchMeta {
  categoryNamesById: Map<string, Set<string>>
  categorySlugById: Map<string, string>
  aliasNamesById: Map<string, Set<string>>
}

const PRODUCT_SEARCH_PAGE_SIZE = 12

export const SEARCH_SORTS: { value: ProductSearchSort; label: string }[] = [
  { value: "relevance", label: "相关度" },
  { value: "priceAsc", label: "价格从低到高" },
  { value: "priceDesc", label: "价格从高到低" },
  { value: "nameAsc", label: "名称" },
]

function nonEmptyText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : ""
  return text || null
}

function lastPathSegment(value: string | null | undefined): string {
  return (value ?? "").split("/").filter(Boolean).at(-1) ?? ""
}

function buildSearchMeta(locale: Locale): ProductSearchMeta {
  const categoryNamesById = new Map<string, Set<string>>()
  const categorySlugById = new Map<string, string>()
  const aliasNamesById = new Map<string, Set<string>>()

  const addCategoryName = (productId: string, name: string | null | undefined) => {
    const text = nonEmptyText(name)
    if (!text) return
    const names = categoryNamesById.get(productId) ?? new Set<string>()
    names.add(text)
    categoryNamesById.set(productId, names)
  }

  const addAliasName = (productId: string, name: string | null | undefined) => {
    const text = nonEmptyText(name)
    if (!text) return
    const names = aliasNamesById.get(productId) ?? new Set<string>()
    names.add(text)
    aliasNamesById.set(productId, names)
  }

  for (const page of catalogPages(locale)) {
    const slug = lastPathSegment(page.url)
    for (const product of page.products) {
      addCategoryName(product.id, page.name)
      if (slug) categorySlugById.set(product.id, slug)
    }
  }

  const { catalogCategories, channelCategories } = catalogData(locale)
  for (const category of [...catalogCategories, ...channelCategories]) {
    for (const product of category.products) {
      addCategoryName(product.id, category.name)
      if (category.slug && !categorySlugById.has(product.id)) {
        categorySlugById.set(product.id, category.slug)
      }
    }
  }

  const productSlugIndex = productsBySlug(locale)
  for (const menuCategory of getMenuCategories(locale)) {
    for (const sub of menuCategory.subs) {
      const product = productSlugIndex.get(lastPathSegment(sub.url))
      if (!product) continue
      addAliasName(product.id, sub.name)
      addAliasName(product.id, menuCategory.name)
    }
  }

  // 常用简称/别名，保证提示与结果页用同一份数据（如 CGM、CGMS、blood glucose）
  const ABBREVIATIONS: [RegExp, string][] = [
    [/continuous glucose monitoring|cgms|动态血糖监测|血糖监测系统/i, "cgm"],
    [/glucose|血糖|blood sugar|血液分析/i, "blood glucose"],
    [/blood pressure|血压/i, "bp"],
    [/pulse oximeter|血氧/i, "spo2"],
    [/oxygen|制氧|氧/i, "o2"],
    [/defibrillator|除颤/i, "aed"],
    [/pregnancy|早孕|hcg/i, "hcg"],
    [/h\. pylori|幽门/i, "hp"],
  ]
  for (const product of allProducts(locale)) {
    const haystack = [
      product.name,
      product.productType,
      product.designText,
      ...(categoryNamesById.get(product.id) ?? []),
    ]
      .filter(Boolean)
      .join(" ")
    for (const [pattern, alias] of ABBREVIATIONS) {
      if (pattern.test(haystack)) {
        addAliasName(product.id, alias)
      }
    }
  }

  return { categoryNamesById, categorySlugById, aliasNamesById }
}

function tokenize(query: string): string[] {
  return query.normalize("NFKC").toLowerCase().trim().split(/\s+/).filter(Boolean)
}

function fieldScore(value: string | null | undefined, term: string): number {
  const text = (value ?? "").normalize("NFKC").toLowerCase().trim()
  if (!text) return 0
  if (text === term) return 120
  if (text.startsWith(term)) return 100
  if (text.includes(term)) return 80
  return 0
}

function productTermScore(product: ProductData, term: string, meta: ProductSearchMeta): number {
  let best = fieldScore(product.name, term)
  best = Math.max(best, Math.round(fieldScore(product.productType, term) * 0.8))
  best = Math.max(best, Math.round(fieldScore(product.designText, term) * 0.7))

  for (const name of meta.categoryNamesById.get(product.id) ?? []) {
    best = Math.max(best, Math.round(fieldScore(name, term) * 0.75))
  }
  for (const alias of meta.aliasNamesById.get(product.id) ?? []) {
    best = Math.max(best, Math.round(fieldScore(alias, term) * 0.75))
  }

  if (product.id === term) best = Math.max(best, 110)
  if ((product.slug ?? "").toLowerCase().includes(term)) best = Math.max(best, 60)

  const detail = product.detail
  const detailText = [
    detail?.description,
    detail?.dimension,
    ...(detail?.benefits ?? []),
    ...(detail?.materials ?? []),
    ...(detail?.care ?? []),
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .normalize("NFKC")
    .toLowerCase()
  if (detailText.includes(term)) best = Math.max(best, 35)

  return best
}

function scoreProduct(
  product: ProductData,
  terms: string[],
  query: string,
  meta: ProductSearchMeta,
): number {
  let total = 0
  for (const term of terms) {
    const score = productTermScore(product, term, meta)
    if (score === 0) return 0
    total += score
  }

  const compactQuery = query.replace(/\s+/g, "").toLowerCase()
  const compactName = product.name.toLowerCase().replace(/\s+/g, "")
  if (compactName.includes(compactQuery)) total += 25
  return total
}

function withSearchMeta(product: ProductData, meta: ProductSearchMeta): SearchProduct {
  return {
    ...product,
    originalPrice: (product as ProductData & { originalPrice?: number | null }).originalPrice,
    category: [...(meta.categoryNamesById.get(product.id) ?? [])][0] ?? null,
    categorySlug: meta.categorySlugById.get(product.id) ?? null,
    score: 0,
  }
}

export function searchProducts(
  query: string,
  options: {
    categorySlug?: string
    sort?: ProductSearchSort
  } = {},
  locale: Locale = DEFAULT_LOCALE,
): SearchProduct[] {
  const meta = buildSearchMeta(locale)
  const normalizedQuery = query.normalize("NFKC").toLowerCase().trim()
  const terms = tokenize(normalizedQuery)
  const all = allProducts(locale)

  const scored = terms.length
    ? all
        .map((product) => ({
          product: withSearchMeta(product, meta),
          score: scoreProduct(product, terms, normalizedQuery, meta),
        }))
        .filter((item) => item.score > 0)
    : all.map((product) => ({
        product: withSearchMeta(product, meta),
        score: 0,
      }))

  const filtered = options.categorySlug
    ? scored.filter((item) => item.product.categorySlug === options.categorySlug)
    : scored

  return filtered
    .sort((a, b) => {
      switch (options.sort ?? "relevance") {
        case "priceAsc":
          return (
            (a.product.price ?? Number.MAX_SAFE_INTEGER) -
            (b.product.price ?? Number.MAX_SAFE_INTEGER)
          )
        case "priceDesc":
          return (
            (b.product.price ?? Number.MIN_SAFE_INTEGER) -
            (a.product.price ?? Number.MIN_SAFE_INTEGER)
          )
        case "nameAsc":
          return a.product.name.localeCompare(b.product.name, locale === "en" ? "en" : "zh-CN")
        case "relevance":
        default:
          return b.score - a.score || (a.product.price ?? 0) - (b.product.price ?? 0)
      }
    })
    .map((item) => item.product)
}

export function paginateSearchResults(
  results: SearchProduct[],
  requestedPage: number,
): {
  items: SearchProduct[]
  page: number
  totalPages: number
  total: number
} {
  const totalPages = Math.max(1, Math.ceil(results.length / PRODUCT_SEARCH_PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const start = (page - 1) * PRODUCT_SEARCH_PAGE_SIZE
  return {
    items: results.slice(start, start + PRODUCT_SEARCH_PAGE_SIZE),
    page,
    totalPages,
    total: results.length,
  }
}

export function parseSearchSort(value: string | undefined): ProductSearchSort {
  const sort = SEARCH_SORTS.find((item) => item.value === value)
  return sort?.value ?? "relevance"
}
