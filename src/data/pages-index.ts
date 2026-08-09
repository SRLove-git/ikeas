import type { ContentPageData } from "./pages-types";
import { loadDataJsonOptional } from "@/lib/data-files";
import { contentPages as legacyPages } from "./pages";

const FAMILY_FILES = [
  "campaigns",
  "customer-service",
  "as-is-online",
  "ideas",
  "ikea-business",
  "landing-page",
  "life-at-home",
  "new",
  "newsroom",
  "planners",
  "product-guides",
  "rooms",
  "root",
  "safety-at-home",
  "stores",
  "this-is-ikea",
  "galleries",
  "business",
  "landing",
  "services",
  "rooms-articles",
] as const;

const EMPTY_PAGES: ContentPageData[] = [];

const legacyContentPages: ContentPageData[] = legacyPages.map((page) => ({
  url: page.url,
  family: page.family,
  id: null,
  title: page.h1 || page.title,
  name: page.title,
  hero: page.hero,
  blocks: (page.sections ?? []).map((section) => ({
    type: "pub-text",
    title: section.heading || null,
    texts: section.text ? [section.text] : [],
    images: section.image ? [section.image] : [],
    links: [],
    items: [],
    settings: null,
  })),
}));

// New crawl wins; legacy pages fill the gaps (e.g. landing pages).
// Indexes are rebuilt whenever the underlying JSON files change, so CMS edits
// become visible without restarting the process.
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
  for (const page of [...current, ...legacyContentPages]) {
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
