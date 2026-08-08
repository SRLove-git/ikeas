import { contentPages, contentPagesByUrl } from "@/data/pages-index";
import type { ContentPageData } from "@/data/pages-types";

export function findContentPage(url: string): ContentPageData | undefined {
  const normalized = url.endsWith("/") ? url : `${url}/`;
  return (
    contentPagesByUrl.get(normalized) ??
    contentPagesByUrl.get(url) ??
    contentPagesByUrl.get(url.replace(/\/$/, ""))
  );
}

export function pagesByFamily(family: string): ContentPageData[] {
  return contentPages.filter((page) => page.family === family);
}

function segments(url: string): string[] {
  return url.split("/").filter(Boolean).slice(2); // after /cn/zh/
}

/** Pages whose path after /cn/zh/ has exactly `depth` segments. */
export function pagesAtDepth(family: string, depth: number): ContentPageData[] {
  return pagesByFamily(family).filter((p) => segments(p.url).length === depth);
}

/** Pages whose path after /cn/zh/ has more than `minDepth` segments. */
export function pagesDeeper(family: string, minDepth: number): ContentPageData[] {
  return pagesByFamily(family).filter((p) => segments(p.url).length > minDepth);
}

export function familyLabel(family: string): string {
  switch (family) {
    case "rooms":
      return "房间";
    case "ideas":
      return "家居灵感";
    case "campaigns":
      return "活动和特惠";
    case "new":
      return "新品";
    case "customer-service":
      return "客户服务";
    case "ikea-business":
      return "宜家对公业务";
    case "this-is-ikea":
      return "关于宜家";
    case "newsroom":
      return "宜家新闻";
    case "product-guides":
      return "产品指南";
    case "life-at-home":
      return "生活在家";
    case "stores":
      return "宜家门店";
    case "planners":
      return "设计和服务";
    case "landing":
      return "页面";
    case "offers":
      return "特惠";
    case "ikea-family":
      return "宜家俱乐部";
    default:
      return "首页";
  }
}

/** A real URL to use as the breadcrumb parent for a family. */
export function familyHomeUrl(family: string): string {
  const first = pagesByFamily(family)[0];
  return first?.url ?? "/";
}

const SPECIFIC_ROUTE_PREFIXES = [
  "/cn/zh/rooms/",
  "/cn/zh/ideas/",
  "/cn/zh/campaigns/",
  "/cn/zh/new/",
  "/cn/zh/planners/",
  "/cn/zh/landing-page/",
  "/cn/zh/personalize-channel/",
  "/cn/zh/ikea-business/",
  "/cn/zh/cat/",
  "/cn/zh/p/",
  "/cn/zh/all-products/",
];

/** True when a more specific route already handles this URL. */
export function isHandledBySpecificRoute(url: string): boolean {
  if (url === "/cn/zh" || url === "/cn/zh/") return true;
  if (url.startsWith("/cn/zh/customer-service/services/")) return true;
  return SPECIFIC_ROUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
}
