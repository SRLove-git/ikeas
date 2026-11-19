import type { SiteScope } from "@/lib/site-scope"

export const ADMIN_SITES = ["portal", "home", "medical"] as const

export function isAdminSite(value: string): value is SiteScope {
  return ADMIN_SITES.some((site) => site === value)
}

// These editors write separate catalogues. Other operational sections use shared data.
export function sectionSite(site: SiteScope, section: string): SiteScope {
  if (section === "brands") return "home"
  if (section === "products") return "medical"
  return site
}

export function adminPath(site: SiteScope, section = "homepage"): string {
  const owner = sectionSite(site, section.split("/")[0])
  return `/admin/${owner}/${section}/`
}

export function loginDestination(value: string | null): string {
  // Accept only an internal, scoped admin path. Editors identify their record in the path.
  if (value && /^\/admin\/(portal|home|medical)\/(?:[\w%-]+\/)*$/.test(value)) return value
  return adminPath("portal")
}
