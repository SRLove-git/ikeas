import { productsBySlug } from "@/data/products-index";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.buzud.com";
  const now = new Date().toISOString();
  const productUrls = Array.from(productsBySlug().keys())
    .map(
      (slug) =>
        `<url><loc>${baseUrl}/cn/zh/p/${slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl}/cn/zh</loc><changefreq>daily</changefreq><priority>1.0</priority></url><url><loc>${baseUrl}/cn/zh/all-products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>${productUrls}</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
