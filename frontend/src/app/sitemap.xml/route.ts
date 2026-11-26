import { allProducts } from "@/data/products-index"
import { getMenuCategories } from "@/data/categories"
import { productHref } from "@/lib/product-url"
import { SITE_SCOPE, SITE_URL, productVisibleInScope } from "@/lib/site-scope"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function withTrailingSlash(path: string): string {
  return path.endsWith("/") ? path : `${path}/`
}

interface SitemapAlternate {
  hrefLang: string
  href: string
}

function urlEntry(
  loc: string,
  changefreq: string,
  priority: string,
  lastmod?: string,
  alternates: SitemapAlternate[] = [],
): string {
  const alternateLinks = alternates
    .map(({ hrefLang, href }) => `<xhtml:link rel="alternate" hreflang="${escapeXml(hrefLang)}" href="${escapeXml(href)}" />`)
    .join("")
  return `<url><loc>${escapeXml(loc)}</loc>${alternateLinks}${
    lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
  }<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

function xmlResponse(entries: string[]): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join(
    "",
  )}</urlset>`
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

export const dynamic = "force-dynamic"

export async function GET() {
  const now = new Date().toISOString()

  // The portal publishes only the two landing-page locales with complete copy.
  if (SITE_SCOPE === "portal") {
    const portalPaths = [
      "",
      "customer-service/",
      "customer-service/contact-us/",
      "customer-service/services/delivery/",
      "customer-service/warranty-registration/",
      "privacy-policy/",
      "conditions-of-use/",
    ]
    return xmlResponse(
      portalPaths.flatMap((path) => {
        const english = `${SITE_URL}/en/${path}`
        const chinese = `${SITE_URL}/zh/${path}`
        const alternates: SitemapAlternate[] = [
          { hrefLang: "en", href: english },
          { hrefLang: "zh-CN", href: chinese },
          { hrefLang: "x-default", href: english },
        ]
        const priority = path ? "0.6" : "1.0"
        return [
          urlEntry(english, "weekly", priority, undefined, alternates),
          urlEntry(chinese, "weekly", priority, undefined, alternates),
        ]
      }),
    )
  }

  const sharedPaths = [
    "/zh/all-products/",
    "/zh/company/",
    "/zh/customer-service/",
    "/zh/customer-service/contact-us/",
    "/zh/customer-service/services/delivery/",
    "/zh/customer-service/services/aftersales/",
    "/zh/customer-service/warranty-registration/",
    "/zh/privacy-policy/",
    "/zh/conditions-of-use/",
    "/zh/online-purchase-agreement/",
  ]

  const categoryPaths =
    SITE_SCOPE === "home"
      ? ["/zh/toshiba/", "/zh/midea/"]
      : Array.from(
          new Set(
            getMenuCategories()
              .map((category) => category.url)
              .filter((url) => url.startsWith("/zh/cat/"))
              .map(withTrailingSlash),
          ),
        )

  const productPaths = allProducts()
    .filter((product) => productVisibleInScope(product))
    .map((product) => productHref(product))

  return xmlResponse([
    urlEntry(`${SITE_URL}/`, "daily", "1.0", now),
    ...categoryPaths.map((path) => urlEntry(`${SITE_URL}${path}`, "weekly", "0.7", now)),
    ...sharedPaths.map((path) => urlEntry(`${SITE_URL}${path}`, "monthly", "0.5", now)),
    ...productPaths.map((path) => urlEntry(`${SITE_URL}${path}`, "weekly", "0.8", now)),
  ])
}
