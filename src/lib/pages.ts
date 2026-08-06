import { contentPages, type ContentPageData } from "@/data/pages";

const byUrl = new Map(contentPages.map((page) => [page.url, page]));

export function findContentPage(url: string): ContentPageData | undefined {
  const normalized = url.endsWith("/") ? url : `${url}/`;
  return byUrl.get(normalized) ?? byUrl.get(url);
}

export function pagesByFamily(family: string): ContentPageData[] {
  return contentPages.filter((page) => page.family === family);
}

export function familyLabel(family: string): string {
  switch (family) {
    case "rooms":
      return "房间";
    case "galleries":
      return "房间灵感";
    case "ideas":
      return "家居灵感";
    case "campaigns":
      return "活动和特惠";
    case "new":
      return "新品";
    case "business":
      return "宜家对公业务";
    case "landing":
      return "页面";
    case "services":
      return "客户服务";
    case "planners":
      return "设计和服务";
    default:
      return "首页";
  }
}
