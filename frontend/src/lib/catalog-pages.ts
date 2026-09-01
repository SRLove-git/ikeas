import type { CatalogPageData } from "@/data/pages-types"
import { loadLocalizedData } from "@/lib/data-files"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

const builtFor = new Map<Locale, CatalogPageData[]>()
const catalogPageBySlug = new Map<Locale, Map<string, CatalogPageData>>()

function ensureIndexes(locale: Locale): void {
  const current = loadLocalizedData<CatalogPageData[]>("catalog-pages/all.json", locale)
  if (builtFor.get(locale) === current) return
  builtFor.set(locale, current)
  const bySlug = new Map<string, CatalogPageData>()
  for (const page of current) {
    const slug = page.url.split("/").filter(Boolean).at(-1) ?? ""
    if (slug) bySlug.set(slug, page)
  }
  catalogPageBySlug.set(locale, bySlug)
}

export function catalogPages(locale: Locale = DEFAULT_LOCALE): CatalogPageData[] {
  ensureIndexes(locale)
  return builtFor.get(locale) ?? []
}

export function findCatalogPageBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): CatalogPageData | undefined {
  ensureIndexes(locale)
  return catalogPageBySlug.get(locale)?.get(slug)
}

/** Product page slug built the same way the live site builds it. */
export function productHref(product: { seoSlug: string | null; id: string }): string {
  return `/zh/p/${product.seoSlug}-${product.id}/`
}
