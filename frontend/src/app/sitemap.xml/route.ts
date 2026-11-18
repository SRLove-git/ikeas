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

function urlEntry(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  return `<url><loc>${escapeXml(loc)}</loc>${
    lastmod ? `<lastmod>${lastmod}</lastmod>` : ""
  }<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

function xmlResponse(entries: string[]): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join(
    "",
  )}</urlset>`
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}

export const dynamic = "force-dynamic"

export async function GET() {
  const now = new Date().toISOString()

  // Each domain publishes its own sitemap; the portal only lists its landing
  // page so every <loc> stays on the same host.
  if (SITE_SCOPE === "portal") {
    return xmlResponse([urlEntry(`${SITE_URL}/`, "daily", "1.0", now)])
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
