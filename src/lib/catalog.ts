import {
  catalogCategories,
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

const allProducts = catalogCategories.flatMap((c) => c.products);

const categoryBySlug = new Map<string, CategoryMatch>();
for (const category of catalogCategories) {
  categoryBySlug.set(category.slug, { category });
  for (const sub of category.subs) {
    categoryBySlug.set(sub.slug, { category, sub });
  }
}

const productBySlug = new Map<string, ProductMatch>();
for (const category of catalogCategories) {
  for (const product of category.products) {
    productBySlug.set(product.slug, { product, category });
  }
}

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
