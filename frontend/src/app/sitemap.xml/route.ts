import { productsBySlug } from "@/data/products-index";
import { catalogData } from "@/data/catalog";
import { catalogPages } from "@/lib/catalog-pages";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medical-sg.com";
  const now = new Date().toISOString();
  const productUrls = Array.from(productsBySlug().keys())
    .map(
      (slug) =>
        `<url><loc>${baseUrl}/cn/zh/p/${slug}/</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    )
    .join("");
  const categoryUrls = [...catalogData().catalogCategories, ...catalogPages()]
    .map((page) => {
      const slug = page.url?.split("/").filter(Boolean).at(-1);
      return slug
        ? `<url><loc>${baseUrl}/cn/zh/cat/${slug}/</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        : "";
    })
    .join("");
  const staticUrls = [
    "/cn/zh/company/",
    "/cn/zh/customer-service/",
    "/cn/zh/customer-service/contact-us/",
    "/cn/zh/customer-service/services/delivery/",
    "/cn/zh/customer-service/services/aftersales/",
    "/cn/zh/customer-service/warranty-registration/",
    "/cn/zh/privacy-policy/",
    "/cn/zh/conditions-of-use/",
    "/cn/zh/online-purchase-agreement/",
  ]
    .map(
      (path) =>
        `<url><loc>${baseUrl}${path}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/cn/zh/</loc><changefreq>daily</changefreq><priority>1.0</priority></url><url><loc>${baseUrl}/cn/zh/all-products/</loc><changefreq>daily</changefreq><priority>0.9</priority></url>${categoryUrls}${staticUrls}${productUrls}</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
