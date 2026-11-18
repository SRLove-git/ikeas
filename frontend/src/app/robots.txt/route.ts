import { SITE_SCOPE, SITE_URL } from "@/lib/site-scope"

export const dynamic = "force-dynamic"

export async function GET() {
  const disallow = ["/admin/", "/api/"]
  if (SITE_SCOPE === "medical") {
    // Appliance routes live on home-sg.com.
    disallow.push("/zh/toshiba/", "/zh/midea/")
  } else if (SITE_SCOPE === "home") {
    // Medical catalogue routes live on medical-sg.com.
    disallow.push("/zh/cat/", "/zh/p/")
  } else {
    disallow.push("/zh/cat/", "/zh/p/", "/zh/toshiba/", "/zh/midea/")
  }

  const body = [
    "User-agent: *",
    "Allow: /",
    ...disallow.map((path) => `Disallow: ${path}`),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
