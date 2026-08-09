import type { CatalogPageData } from "@/data/pages-types";
import { loadDataJson } from "@/lib/data-files";

let builtFor: CatalogPageData[] | null = null;
let catalogPageList: CatalogPageData[] = [];
let catalogPageBySlug = new Map<string, CatalogPageData>();

function ensureIndexes(): void {
  const current = loadDataJson<CatalogPageData[]>("catalog-pages/all.json");
  if (builtFor === current) return;
  builtFor = current;
  catalogPageList = current;
  catalogPageBySlug = new Map<string, CatalogPageData>();
  for (const page of current) {
    const slug = page.url.split("/").filter(Boolean).at(-1) ?? "";
    if (slug) catalogPageBySlug.set(slug, page);
  }
}

export function catalogPages(): CatalogPageData[] {
  ensureIndexes();
  return catalogPageList;
}

export function findCatalogPageBySlug(
  slug: string,
): CatalogPageData | undefined {
  ensureIndexes();
  return catalogPageBySlug.get(slug);
}

/** Product page slug built the same way the live site builds it. */
export function productHref(
  product: { seoSlug: string | null; id: string },
): string {
  return `/cn/zh/p/${product.seoSlug}-${product.id}/`;
}
