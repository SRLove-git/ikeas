import { contentPages, contentPagesByUrl } from "@/data/pages-index"
import type { ContentPageData } from "@/data/pages-types"

export function findContentPage(url: string): ContentPageData | undefined {
  const key = url.replace(/\/+$/, "")
  return contentPagesByUrl().get(key)
}

export function pagesByFamily(family: string): ContentPageData[] {
  return contentPages().filter((page) => page.family === family)
}

function segments(url: string): string[] {
  return url.split("/").filter(Boolean).slice(2) // after /cn/zh/
}

/** Pages whose path after /cn/zh/ has exactly `depth` segments. */
export function pagesAtDepth(family: string, depth: number): ContentPageData[] {
  return pagesByFamily(family).filter((p) => segments(p.url).length === depth)
}

/** Pages whose path after /cn/zh/ has more than `minDepth` segments. */
export function pagesDeeper(family: string, minDepth: number): ContentPageData[] {
  return pagesByFamily(family).filter((p) => segments(p.url).length > minDepth)
}

export function familyLabel(family: string): string {
  switch (family) {
    case "customer-service":
      return "客户服务"
    default:
      return "首页"
  }
}

/** A real URL to use as the breadcrumb parent for a family. */
export function familyHomeUrl(family: string): string {
  const first = pagesByFamily(family)[0]
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
