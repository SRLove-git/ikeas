import { contentPages, contentPagesByUrl } from "@/data/pages-index"
import type { ContentPageData } from "@/data/pages-types"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

export function findContentPage(
  url: string,
  locale: Locale = DEFAULT_LOCALE,
): ContentPageData | undefined {
  const key = url.replace(/\/+$/, "")
  return contentPagesByUrl(locale).get(key)
}

export function pagesByFamily(family: string, locale: Locale = DEFAULT_LOCALE): ContentPageData[] {
  return contentPages(locale).filter((page) => page.family === family)
}

function segments(url: string): string[] {
  return url.split("/").filter(Boolean).slice(2) // after /cn/zh/
}

/** Pages whose path after /cn/zh/ has exactly `depth` segments. */
export function pagesAtDepth(
  family: string,
  depth: number,
  locale: Locale = DEFAULT_LOCALE,
): ContentPageData[] {
  return pagesByFamily(family, locale).filter((p) => segments(p.url).length === depth)
}

/** Pages whose path after /cn/zh/ has more than `minDepth` segments. */
export function pagesDeeper(
  family: string,
  minDepth: number,
  locale: Locale = DEFAULT_LOCALE,
): ContentPageData[] {
  return pagesByFamily(family, locale).filter((p) => segments(p.url).length > minDepth)
}

export function familyLabel(family: string, locale: Locale = DEFAULT_LOCALE): string {
  switch (family) {
    case "customer-service":
      return locale === "en" ? "Customer service" : "客户服务"
    case "company":
      return locale === "en" ? "Company" : "公司介绍"
    default:
      return locale === "en" ? "Home" : "首页"
  }
}

/** A real URL to use as the breadcrumb parent for a family. */
export function familyHomeUrl(family: string, locale: Locale = DEFAULT_LOCALE): string {
  const first = pagesByFamily(family, locale)[0]
  return first?.url ?? "/"
}

// Families handled by dedicated routes up to the given path depth
// (counting all segments including "cn" and "zh"). Deeper URLs fall to the
// generic catch-all route so article sub-pages never 404.
const SPECIFIC_ROUTE_DEPTHS: [string, number][] = [
  ["/cn/zh/rooms/", Infinity],
  ["/cn/zh/ideas/", 4],
  ["/cn/zh/campaigns/", 4],
  ["/cn/zh/new/", 4],
  ["/cn/zh/planners/", 4],
  ["/cn/zh/landing-page/", 4],
  ["/cn/zh/personalize-channel/", 4],
  ["/cn/zh/ikea-business/", Infinity],
  ["/cn/zh/cat/", Infinity],
  ["/cn/zh/p/", Infinity],
  ["/cn/zh/all-products/", 3],
]

/** True when a more specific route already handles this URL. */
export function isHandledBySpecificRoute(url: string): boolean {
  if (url === "/cn/zh" || url === "/cn/zh/") return true
  if (url.startsWith("/cn/zh/customer-service/services/")) return true
  const depth = url.split("/").filter(Boolean).length
  return SPECIFIC_ROUTE_DEPTHS.some(
    ([prefix, maxDepth]) => url.startsWith(prefix) && depth <= maxDepth,
  )
}
