import { adminGuard } from "@/lib/admin-auth"
import { BRANDS, isBrandId, listBrandCategories } from "@/lib/brand-store"

export async function GET(request: Request) {
  const guard = await adminGuard()
  if (guard) return guard
  const brand = new URL(request.url).searchParams.get("brand") ?? ""
  if (!isBrandId(brand)) {
    return Response.json({ error: `brand 必须是 ${BRANDS.join(" / ")}` }, { status: 400 })
  }
  return Response.json({ items: listBrandCategories(brand) })
}
