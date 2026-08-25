import {
  catalogData,
  type CatalogCategory,
  type CatalogProduct,
} from "@/data/catalog";
import { productsBySlug } from "@/data/products-index";
import { catalogPages } from "@/lib/catalog-pages";
import type { ProductData } from "@/data/pages-types";
import { getCollectionHref } from "@/lib/catalog-format";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

export { formatPrice, getCollectionHref } from "@/lib/catalog-format";

export interface CategoryMatch {
  category: CatalogCategory;
  sub?: { name: string; slug: string; url: string; image: string | null };
}

export interface ProductMatch {
  product: CatalogProduct | ProductData;
  category: { name: string; href: string } | null;
}

const builtFor = new Map<Locale, CatalogCategory[]>();
const categoryBySlug = new Map<Locale, Map<string, CategoryMatch>>();
const productBySlug = new Map<
  Locale,
  Map<string, { product: CatalogProduct; category: CatalogCategory }>
>();

function ensureIndexes(locale: Locale): void {
  if (builtFor.has(locale)) return;
  const current = catalogData(locale);
  const collections = [...current.catalogCategories, ...current.channelCategories];
  builtFor.set(locale, collections);
  const categories = new Map<string, CategoryMatch>();
  const products = new Map<string, { product: CatalogProduct; category: CatalogCategory }>();
  for (const category of collections) {
    categories.set(category.slug, { category });
    for (const sub of category.subs) {
      categories.set(sub.slug, { category, sub });
    }
    for (const product of category.products) {
      products.set(product.slug, { product, category });
    }
  }
  categoryBySlug.set(locale, categories);
  productBySlug.set(locale, products);
}

export function findCategoryBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): CategoryMatch | undefined {
  ensureIndexes(locale);
  return categoryBySlug.get(locale)?.get(slug);
}

export function findProductBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
): ProductMatch | undefined {
  ensureIndexes(locale);
  const match = productBySlug.get(locale)?.get(slug);
  if (match) {
    return {
      product: match.product,
      category: {
        name: match.category.name,
        href: getCollectionHref(match.category),
      },
    };
  }
  const product = productsBySlug(locale).get(slug);
  if (product) {
    return { product, category: findCategoryNameForProductId(product.id, locale) };
  }
  return undefined;
}

export function findCategoryNameForProductId(
  id: string,
  locale: Locale = DEFAULT_LOCALE,
): { name: string; href: string } | null {
  for (const page of catalogPages(locale)) {
    if (page.products.some((p) => p.id === id)) {
      return { name: page.name, href: page.url };
    }
  }
  ensureIndexes(locale);
  for (const category of builtFor.get(locale) ?? []) {
    if (category.products.some((p) => String(p.id) === id)) {
      return { name: category.name, href: getCollectionHref(category) };
    }
  }
  return null;
}

export function productSlugsWithDetails(locale: Locale = DEFAULT_LOCALE): Set<string> {
  ensureIndexes(locale);
  return new Set([
    ...(productBySlug.get(locale)?.keys() ?? []),
    ...productsBySlug(locale).keys(),
  ]);
}
