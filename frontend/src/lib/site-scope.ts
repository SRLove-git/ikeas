// Build-time deployment scope for the three BUZUD storefronts.
//
//   NEXT_PUBLIC_SITE_SCOPE=medical -> medical-sg.com (BUZUD health catalogue)
//   NEXT_PUBLIC_SITE_SCOPE=home    -> home-sg.com    (Midea / Toshiba appliances)
//   NEXT_PUBLIC_SITE_SCOPE=portal  -> life-sg.com    (brand portal + shared account)
//
// The value is read from a NEXT_PUBLIC_* variable so the same constant is
// inlined into both server and client bundles at build time. Keep this module
// dependency-free: client components import it directly.

export type SiteScope = "medical" | "home" | "portal"

const DEFAULT_SCOPE: SiteScope = "medical"

function isSiteScope(value: string | undefined): value is SiteScope {
  return value === "medical" || value === "home" || value === "portal"
}

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

function envUrl(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim()
  return withoutTrailingSlash(trimmed || fallback)
}

/** Canonical storefront origins, overridable per deployment. */
export const MEDICAL_URL = envUrl(process.env.NEXT_PUBLIC_MEDICAL_URL, "https://medical-sg.com")
export const HOME_URL = envUrl(process.env.NEXT_PUBLIC_HOME_URL, "https://home-sg.com")
export const PORTAL_URL = envUrl(process.env.NEXT_PUBLIC_PORTAL_URL, "https://life-sg.com")

const configuredScope = process.env.NEXT_PUBLIC_SITE_SCOPE?.trim()

/** Scope of the current build. Unknown/unset values fall back to `medical`. */
export const SITE_SCOPE: SiteScope = isSiteScope(configuredScope) ? configuredScope : DEFAULT_SCOPE

const SITE_URLS: Record<SiteScope, string> = {
  medical: MEDICAL_URL,
  home: HOME_URL,
  portal: PORTAL_URL,
}

/** Canonical origin of the current build, used for metadata and SEO files. */
export const SITE_URL = envUrl(process.env.NEXT_PUBLIC_SITE_URL, SITE_URLS[SITE_SCOPE])

export function siteUrl(scope: SiteScope = SITE_SCOPE): string {
  return SITE_URLS[scope]
}

export interface ScopedProduct {
  id?: string | null
  slug?: string | null
}

export function isBrandProductId(id: string | null | undefined): boolean {
  return typeof id === "string" && (id.startsWith("midea-") || id.startsWith("toshiba-"))
}

export function isBrandProductSlug(slug: string | null | undefined): boolean {
  return typeof slug === "string" && (slug.startsWith("midea-") || slug.startsWith("toshiba-"))
}

/** Which storefront a product belongs to (appliance brands -> home). */
export function siteForProduct(
  product: ScopedProduct | null | undefined,
): Extract<SiteScope, "medical" | "home"> {
  if (!product) return "medical"
  if (isBrandProductId(product.id) || isBrandProductSlug(product.slug)) return "home"
  return "medical"
}

export function productVisibleInScope(
  product: ScopedProduct | null | undefined,
  scope: SiteScope = SITE_SCOPE,
): boolean {
  if (!product || scope === "portal") return false
  return siteForProduct(product) === scope
}

export interface ScopedCategory {
  /** Localized CMS menu group, e.g. 医疗 / Medical or 家电 / Home Appliances. */
  group?: string | null
  /** Canonical catalogue route; preferred for locale-independent scoping. */
  url?: string | null
}

const MEDICAL_GROUP_NAMES = new Set(["医疗", "Medical", "Perubatan", "Medis"])
const HOME_GROUP_NAMES = new Set(["家电", "Home Appliances", "Peralatan Rumah"])

/** Catalogue visibility follows the route first, with localized groups as fallback. */
export function categoryVisibleInScope(
  category: ScopedCategory | null | undefined,
  scope: SiteScope = SITE_SCOPE,
): boolean {
  if (!category) return false
  if (category.url) {
    if (scope === "medical") return isMedicalCatalogPath(category.url)
    if (scope === "home") return isAppliancePath(category.url)
  }
  if (scope === "medical") return MEDICAL_GROUP_NAMES.has(category.group?.trim() ?? "")
  if (scope === "home") return HOME_GROUP_NAMES.has(category.group?.trim() ?? "")
  return false
}

const APPLIANCE_PATH = /^\/zh\/(?:toshiba|midea)(?=[/?#]|$)/
const MEDICAL_CATALOG_PATH = /^\/zh\/(?:cat|p|search)(?=[/?#]|$)/
const PRODUCT_CATALOG_PATH = /^\/zh\/(?:cat|p|search|all-products)(?=[/?#]|$)/

function pathnameOf(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value)
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return value
    }
  }
  return value
}

export function isAppliancePath(path: string | null | undefined): boolean {
  return typeof path === "string" && APPLIANCE_PATH.test(pathnameOf(path))
}

export function isMedicalCatalogPath(path: string | null | undefined): boolean {
  return typeof path === "string" && MEDICAL_CATALOG_PATH.test(pathnameOf(path))
}

export function isProductCatalogPath(path: string | null | undefined): boolean {
  return typeof path === "string" && PRODUCT_CATALOG_PATH.test(pathnameOf(path))
}

/**
 * Whether a CMS-managed navigation/footer href belongs on the current site.
 * Neutral links (customer service, company, legal, mailto, ...) stay on every
 * storefront; product-catalogue links are scoped.
 */
export function hrefVisibleInScope(
  href: string | null | undefined,
  scope: SiteScope = SITE_SCOPE,
): boolean {
  if (!href) return true
  if (/^(?:mailto:|tel:|#)/i.test(href)) return true
  const path = pathnameOf(href)
  if (!path.startsWith("/")) return true
  if (scope === "portal") return !isProductCatalogPath(path)
  if (scope === "home") return !isMedicalCatalogPath(path)
  return !isAppliancePath(path)
}

/** Absolute URL on the given storefront. Already-absolute URLs pass through. */
export function absoluteUrl(site: SiteScope, path = "/"): string {
  const value = path.trim()
  if (/^https?:\/\//i.test(value)) return value
  if (!value) return siteUrl(site)
  const suffix = value.startsWith("/") ? value : `/${value}`
  return `${siteUrl(site)}${suffix}`
}

/**
 * URL for a link shown on the current site: same-origin path for the current
 * scope, absolute cross-domain URL for the other storefronts.
 */
export function crossSiteUrl(site: SiteScope, path = "/"): string {
  const value = path.trim()
  if (/^https?:\/\//i.test(value)) return value
  if (site === SITE_SCOPE) return value ? (value.startsWith("/") ? value : `/${value}`) : "/"
  return absoluteUrl(site, value)
}

/**
 * Login entry URL. medical/home hand authentication to the portal SSO entry
 * with an absolute return URL; the portal keeps its own login page.
 */
export function loginUrl(returnPath = "/zh/profile/"): string {
  if (SITE_SCOPE === "portal") return "/zh/profile/login/"
  const returnUrl = absoluteUrl(SITE_SCOPE, returnPath)
  return `${PORTAL_URL}/zh/profile/login/?return=${encodeURIComponent(returnUrl)}`
}
