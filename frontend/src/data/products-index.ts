import type { ProductData } from "./pages-types";
import { loadLocalizedData } from "@/lib/data-files";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const PARTS = ["part-1", "part-2", "part-3", "part-4", "part-5", "part-6"] as const;

// CMS-managed product store: reads the same products-part-*.json files the
// admin panel writes, and rebuilds slug/id indexes whenever the files change.
const builtFor = new Map<Locale, ProductData[][]>();
const allProductList = new Map<Locale, ProductData[]>();
const productsBySlugMap = new Map<Locale, Map<string, ProductData>>();
const productsByIdMap = new Map<Locale, Map<string, ProductData>>();

function ensureIndexes(locale: Locale): void {
  const current = PARTS.map((part) =>
    loadLocalizedData<ProductData[]>(`products/products-${part}.json`, locale),
  );
  if (builtFor.get(locale) === current) return;
  builtFor.set(locale, current);
  const list = current.flat();
  allProductList.set(locale, list);
  productsBySlugMap.set(
    locale,
    new Map(list.map((product) => [product.slug, product])),
  );
  productsByIdMap.set(
    locale,
    new Map(list.map((product) => [product.id, product])),
  );
}

export function allProducts(locale: Locale = DEFAULT_LOCALE): ProductData[] {
  ensureIndexes(locale);
  return allProductList.get(locale) ?? [];
}

export function productsBySlug(locale: Locale = DEFAULT_LOCALE): Map<string, ProductData> {
  ensureIndexes(locale);
  return productsBySlugMap.get(locale) ?? new Map();
}

export function productsById(locale: Locale = DEFAULT_LOCALE): Map<string, ProductData> {
  ensureIndexes(locale);
  return productsByIdMap.get(locale) ?? new Map();
}
