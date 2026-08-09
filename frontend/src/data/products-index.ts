import type { ProductData } from "./pages-types";
import { loadDataJson } from "@/lib/data-files";

const PARTS = ["part-1", "part-2", "part-3", "part-4", "part-5", "part-6"] as const;

// CMS-managed product store: reads the same products-part-*.json files the
// admin panel writes, and rebuilds slug/id indexes whenever the files change.
let builtFor: ProductData[][] | null = null;
let allProductList: ProductData[] = [];
let productsBySlugMap = new Map<string, ProductData>();
let productsByIdMap = new Map<string, ProductData>();

function ensureIndexes(): void {
  const current = PARTS.map((part) =>
    loadDataJson<ProductData[]>(`products/products-${part}.json`),
  );
  if (builtFor === current) return;
  builtFor = current;
  allProductList = current.flat();
  productsBySlugMap = new Map(allProductList.map((product) => [product.slug, product]));
  productsByIdMap = new Map(allProductList.map((product) => [product.id, product]));
}

export function allProducts(): ProductData[] {
  ensureIndexes();
  return allProductList;
}

export function productsBySlug(): Map<string, ProductData> {
  ensureIndexes();
  return productsBySlugMap;
}

export function productsById(): Map<string, ProductData> {
  ensureIndexes();
  return productsByIdMap;
}
