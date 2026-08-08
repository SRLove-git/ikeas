import {
  catalogCategories,
  channelCategories,
  type CatalogCategory,
  type CatalogProduct,
} from "@/data/catalog";

export interface CategoryMatch {
  category: CatalogCategory;
  sub?: { name: string; slug: string; url: string; image: string | null };
}

export interface ProductMatch {
  product: CatalogProduct;
  category: CatalogCategory;
}

const allCollections: CatalogCategory[] = [...catalogCategories, ...channelCategories];

const categoryBySlug = new Map<string, CategoryMatch>();
for (const category of allCollections) {
  categoryBySlug.set(category.slug, { category });
  for (const sub of category.subs) {
    categoryBySlug.set(sub.slug, { category, sub });
  }
}

const productBySlug = new Map<string, ProductMatch>();
for (const category of allCollections) {
  for (const product of category.products) {
    productBySlug.set(product.slug, { product, category });
  }
}

export const productSlugsWithDetails = new Set(productBySlug.keys());

export function findCategoryBySlug(slug: string): CategoryMatch | undefined {
  return categoryBySlug.get(slug);
}

export function findProductBySlug(slug: string): ProductMatch | undefined {
  return productBySlug.get(slug);
}

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
