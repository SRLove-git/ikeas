import {
  catalogCategories,
  channelCategories,
  type CatalogCategory,
  type CatalogProduct,
} from "@/data/catalog";
import { productsBySlug, productsById } from "@/data/products-index";
import { catalogPages } from "@/lib/catalog-pages";
import type { ProductData } from "@/data/pages-types";

export interface CategoryMatch {
  category: CatalogCategory;
  sub?: { name: string; slug: string; url: string; image: string | null };
}

export interface ProductMatch {
  product: CatalogProduct | ProductData;
  category: { name: string; href: string } | null;
}

const allCollections: CatalogCategory[] = [...catalogCategories, ...channelCategories];

const categoryBySlug = new Map<string, CategoryMatch>();
for (const category of allCollections) {
  categoryBySlug.set(category.slug, { category });
  for (const sub of category.subs) {
    categoryBySlug.set(sub.slug, { category, sub });
  }
}

const productBySlug = new Map<string, { product: CatalogProduct; category: CatalogCategory }>();
for (const category of allCollections) {
  for (const product of category.products) {
    productBySlug.set(product.slug, { product, category });
  }
}

export function findCategoryBySlug(slug: string): CategoryMatch | undefined {
  return categoryBySlug.get(slug);
}

export function findProductBySlug(slug: string): ProductMatch | undefined {
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
  const product = productsBySlug.get(slug);
  if (product) {
    return { product, category: findCategoryNameForProductId(product.id) };
  }
  return undefined;
}

export function findCategoryNameForProductId(
  id: string,
): { name: string; href: string } | null {
  for (const page of catalogPages) {
    if (page.products.some((p) => p.id === id)) {
      return { name: page.name, href: page.url };
    }
  }
  for (const category of allCollections) {
    if (category.products.some((p) => String(p.id) === id)) {
      return { name: category.name, href: getCollectionHref(category) };
    }
  }
  return null;
}

export const productSlugsWithDetails = new Set([
  ...productBySlug.keys(),
  ...productsBySlug.keys(),
]);

export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return "";
  return `¥${price.toLocaleString("zh-CN", {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getCollectionHref(category: CatalogCategory): string {
  if (category.url.startsWith("/cn/zh/personalize-channel/")) {
    return category.url;
  }
  return `/cn/zh/cat/${category.slug}`;
}
