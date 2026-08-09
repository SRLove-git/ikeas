import {
  catalogData,
  type CatalogCategory,
  type CatalogProduct,
} from "@/data/catalog";
import { productsBySlug } from "@/data/products-index";
import { catalogPages } from "@/lib/catalog-pages";
import type { ProductData } from "@/data/pages-types";
import { getCollectionHref } from "@/lib/catalog-format";

export { formatPrice, getCollectionHref } from "@/lib/catalog-format";

export interface CategoryMatch {
  category: CatalogCategory;
  sub?: { name: string; slug: string; url: string; image: string | null };
}

export interface ProductMatch {
  product: CatalogProduct | ProductData;
  category: { name: string; href: string } | null;
}

let builtFor: ReturnType<typeof catalogData> | null = null;
let allCollections: CatalogCategory[] = [];
let categoryBySlug = new Map<string, CategoryMatch>();
let productBySlug = new Map<string, { product: CatalogProduct; category: CatalogCategory }>();

function ensureIndexes(): void {
  const current = catalogData();
  if (builtFor === current) return;
  builtFor = current;
  allCollections = [...current.catalogCategories, ...current.channelCategories];
  categoryBySlug = new Map<string, CategoryMatch>();
  productBySlug = new Map<string, { product: CatalogProduct; category: CatalogCategory }>();
  for (const category of allCollections) {
    categoryBySlug.set(category.slug, { category });
    for (const sub of category.subs) {
      categoryBySlug.set(sub.slug, { category, sub });
    }
    for (const product of category.products) {
      productBySlug.set(product.slug, { product, category });
    }
  }
}

export function findCategoryBySlug(slug: string): CategoryMatch | undefined {
  ensureIndexes();
  return categoryBySlug.get(slug);
}

export function findProductBySlug(slug: string): ProductMatch | undefined {
  ensureIndexes();
  const match = productBySlug.get(slug);
  if (match) {
    return {
      product: match.product,
      category: {
        name: match.category.name,
        href: getCollectionHref(match.category),
      },
    };
  }
  const product = productsBySlug().get(slug);
  if (product) {
    return { product, category: findCategoryNameForProductId(product.id) };
  }
  return undefined;
}

export function findCategoryNameForProductId(
  id: string,
): { name: string; href: string } | null {
  for (const page of catalogPages()) {
    if (page.products.some((p) => p.id === id)) {
      return { name: page.name, href: page.url };
    }
  }
  ensureIndexes();
  for (const category of allCollections) {
    if (category.products.some((p) => String(p.id) === id)) {
      return { name: category.name, href: getCollectionHref(category) };
    }
  }
  return null;
}

export function productSlugsWithDetails(): Set<string> {
  ensureIndexes();
  return new Set([...productBySlug.keys(), ...productsBySlug().keys()]);
}
