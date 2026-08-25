import type { ContentPageData } from "./pages-types";
import { loadDataJsonOptional } from "@/lib/data-files";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

const FAMILY_FILES = [
  "customer-service",
  "company",
  "legal",
  "root",
] as const;

const EMPTY_PAGES: ContentPageData[] = [];
const builtFor = new Map<Locale, ContentPageData[]>();
const contentPageList = new Map<Locale, ContentPageData[]>();
const contentPagesByUrlMap = new Map<Locale, Map<string, ContentPageData>>();

function ensureIndexes(locale: Locale): void {
  const current = FAMILY_FILES.flatMap((family) =>
    locale === "en"
      ? loadDataJsonOptional<ContentPageData[]>(
          `pages/${family}.en.json`,
          loadDataJsonOptional<ContentPageData[]>(`pages/${family}.json`, EMPTY_PAGES),
        )
      : loadDataJsonOptional<ContentPageData[]>(`pages/${family}.json`, EMPTY_PAGES),
  );
  if (builtFor.get(locale) === current) return;
  builtFor.set(locale, current);
  const byUrl = new Map<string, ContentPageData>();
  for (const page of current) {
    const key = page.url.replace(/\/$/, "");
    if (!byUrl.has(key)) byUrl.set(key, page);
  }
  const list = [...byUrl.values()];
  contentPageList.set(locale, list);
  contentPagesByUrlMap.set(
    locale,
    new Map(list.map((page) => [page.url.replace(/\/$/, ""), page])),
  );
}

export function contentPages(locale: Locale = DEFAULT_LOCALE): ContentPageData[] {
  ensureIndexes(locale);
  return contentPageList.get(locale) ?? [];
}

export function contentPagesByUrl(locale: Locale = DEFAULT_LOCALE): Map<string, ContentPageData> {
  ensureIndexes(locale);
  return contentPagesByUrlMap.get(locale) ?? new Map();
}
