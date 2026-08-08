import allCatalogPages from "@/data/catalog-pages/all.json";
import type { CatalogPageData } from "@/data/pages-types";

export const catalogPages = allCatalogPages as unknown as CatalogPageData[];

const catalogPageBySlug = new Map<string, CatalogPageData>();
for (const page of catalogPages) {
  const slug = page.url.split("/").filter(Boolean).at(-1) ?? "";
  if (slug) catalogPageBySlug.set(slug, page);
}

export function findCatalogPageBySlug(
  slug: string,
): CatalogPageData | undefined {
  return catalogPageBySlug.get(slug);
}

/** Product page slug built the same way the live site builds it. */
export function productHref(
  product: { seoSlug: string | null; id: string },
): string {
  return `/cn/zh/p/${product.seoSlug}-${product.id}/`;
}
