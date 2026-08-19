import type { ContentPageData } from "./pages-types";
import { loadDataJsonOptional } from "@/lib/data-files";

const FAMILY_FILES = [
  "customer-service",
  "company",
  "legal",
  "root",
] as const;

const EMPTY_PAGES: ContentPageData[] = [];
let builtFor: ContentPageData[] | null = null;
let contentPageList: ContentPageData[] = [];
let contentPagesByUrlMap = new Map<string, ContentPageData>();

function ensureIndexes(): void {
  const current = FAMILY_FILES.flatMap((family) =>
    loadDataJsonOptional<ContentPageData[]>(`pages/${family}.json`, EMPTY_PAGES),
  );
  if (builtFor === current) return;
  builtFor = current;
  const byUrl = new Map<string, ContentPageData>();
  for (const page of current) {
    const key = page.url.replace(/\/$/, "");
    if (!byUrl.has(key)) byUrl.set(key, page);
  }
  contentPageList = [...byUrl.values()];
  contentPagesByUrlMap = new Map(
    contentPageList.map((page) => [page.url.replace(/\/$/, ""), page]),
  );
}

export function contentPages(): ContentPageData[] {
  ensureIndexes();
  return contentPageList;
}

export function contentPagesByUrl(): Map<string, ContentPageData> {
  ensureIndexes();
  return contentPagesByUrlMap;
}
