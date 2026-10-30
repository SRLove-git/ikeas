export interface SyncProduct {
  id: string
  slug: string
  name: string
  [key: string]: unknown
}

type ProductRecord = Record<string, unknown> & { id?: unknown; slug?: unknown }
type ProductCollection = { products?: ProductRecord[] }

export interface CatalogRecord {
  catalogCategories?: ProductCollection[]
  channelCategories?: ProductCollection[]
}

export interface CatalogPageRecord {
  products?: ProductRecord[]
}

const COMMERCIAL_FIELDS = ["slug", "price", "originalPrice", "image"] as const

function clone<T>(value: T): T {
  return structuredClone(value)
}

function matchesProduct(
  candidate: ProductRecord,
  product: SyncProduct,
  existingIdOrSlug?: string,
): boolean {
  const id = String(candidate.id ?? "")
  const slug = String(candidate.slug ?? "")
  return (
    id === product.id ||
    slug === product.slug ||
    Boolean(existingIdOrSlug && (id === existingIdOrSlug || slug === existingIdOrSlug))
  )
}

function withoutAdminFields(product: SyncProduct): ProductRecord {
  const copy = clone(product) as ProductRecord
  delete copy.categories
  return copy
}

/**
 * Updates fields that are identical in every locale while preserving translated
 * names, product types, labels and descriptive copy.
 */
export function mergeCommercialProductFields(
  localized: ProductRecord,
  source: SyncProduct,
): ProductRecord {
  const next = clone(localized)
  for (const field of COMMERCIAL_FIELDS) {
    if (field in source) next[field] = clone(source[field])
  }

  const sourceDetail = source.detail
  if (
    sourceDetail &&
    typeof sourceDetail === "object" &&
    !Array.isArray(sourceDetail) &&
    "images" in sourceDetail
  ) {
    const currentDetail =
      next.detail && typeof next.detail === "object" && !Array.isArray(next.detail)
        ? (next.detail as Record<string, unknown>)
        : {}
    next.detail = {
      ...currentDetail,
      images: clone((sourceDetail as Record<string, unknown>).images),
    }
  }
  return next
}

export function syncProductList(
  products: ProductRecord[],
  product: SyncProduct,
  options: { existingIdOrSlug?: string; localized?: boolean } = {},
): number {
  let updated = 0
  for (let index = 0; index < products.length; index += 1) {
    if (!matchesProduct(products[index], product, options.existingIdOrSlug)) continue
    products[index] = options.localized
      ? mergeCommercialProductFields(products[index], product)
      : withoutAdminFields(product)
    updated += 1
  }
  return updated
}

export function syncProductInCatalog(
  catalog: CatalogRecord,
  product: SyncProduct,
  options: { existingIdOrSlug?: string; localized?: boolean } = {},
): number {
  return [...(catalog.catalogCategories ?? []), ...(catalog.channelCategories ?? [])].reduce(
    (count, category) => count + syncProductList(category.products ?? [], product, options),
    0,
  )
}

export function catalogPageSeoSlug(product: Pick<SyncProduct, "id" | "slug">): string {
  const idSuffix = `-${product.id}`
  return product.slug.endsWith(idSuffix) ? product.slug.slice(0, -idSuffix.length) : product.slug
}

export function syncProductInCatalogPages(
  pages: CatalogPageRecord[],
  product: SyncProduct,
  options: { existingIdOrSlug?: string; localized?: boolean } = {},
): number {
  let updated = 0
  for (const page of pages) {
    for (const target of page.products ?? []) {
      if (!matchesProduct(target, product, options.existingIdOrSlug)) continue
      target.price = clone(product.price)
      target.image = clone(product.image)
      target.seoSlug = catalogPageSeoSlug(product)
      if (!options.localized) {
        target.name = product.name
        target.productType = clone(product.productType)
        target.designText = clone(product.designText)
      }
      updated += 1
    }
  }
  return updated
}
