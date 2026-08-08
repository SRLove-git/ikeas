import type { ContentPageData } from "./pages-types";
import campaigns from "./pages/campaigns.json";
import customerService from "./pages/customer-service.json";
import asIsOnline from "./pages/as-is-online.json";
import ideas from "./pages/ideas.json";
import ikeaBusiness from "./pages/ikea-business.json";
import landingPage from "./pages/landing-page.json";
import lifeAtHome from "./pages/life-at-home.json";
import newPages from "./pages/new.json";
import newsroom from "./pages/newsroom.json";
import planners from "./pages/planners.json";
import productGuides from "./pages/product-guides.json";
import rooms from "./pages/rooms.json";
import root from "./pages/root.json";
import safetyAtHome from "./pages/safety-at-home.json";
import stores from "./pages/stores.json";
import thisIsIkea from "./pages/this-is-ikea.json";
import { contentPages as legacyPages } from "./pages";

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

const crawledPages: ContentPageData[] = [
  ...campaigns,
  ...customerService,
  ...asIsOnline,
  ...ideas,
  ...ikeaBusiness,
  ...landingPage,
  ...lifeAtHome,
  ...newPages,
  ...newsroom,
  ...planners,
  ...productGuides,
  ...rooms,
  ...root,
  ...safetyAtHome,
  ...stores,
  ...thisIsIkea,
];

// New crawl wins; legacy pages fill the gaps (e.g. landing pages).
const byUrl = new Map<string, ContentPageData>();
for (const page of [...crawledPages, ...legacyContentPages]) {
  const key = page.url.replace(/\/$/, "");
  if (!byUrl.has(key)) byUrl.set(key, page);
}

export const contentPages: ContentPageData[] = [...byUrl.values()];

export const contentPagesByUrl = new Map(
  contentPages.map((page) => [page.url.replace(/\/$/, ""), page]),
);
