import { adminGuard } from "@/lib/admin-auth"
import { BRANDS, createBrandProduct, isBrandId, listBrandProducts } from "@/lib/brand-store"
import { appendChangelog } from "@/lib/admin-store"
import { AdminBackendSyncError, upsertBackendProduct } from "@/lib/admin-backend"
import { toBrandCommerceProduct } from "@/data/brand-commerce"

export async function GET(request: Request) {
  const guard = await adminGuard()
  if (guard) return guard

  const url = new URL(request.url)
  const brand = url.searchParams.get("brand") ?? ""
  if (!isBrandId(brand)) {
    return Response.json({ error: `brand 必须是 ${BRANDS.join(" / ")}` }, { status: 400 })
  }
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50) || 50))

  const all = listBrandProducts(brand)
  const filtered = q
    ? all.filter(
        (item) =>
          item.model.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q),
      )
    : all

  return Response.json({
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pageSize,
  })
}

export async function POST(request: Request) {
  const guard = await adminGuard()
  if (guard) return guard

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 })
  const brand = String(body.brand ?? "")
  if (!isBrandId(brand)) {
    return Response.json({ error: `brand 必须是 ${BRANDS.join(" / ")}` }, { status: 400 })
  }
  try {
    const product = await createBrandProduct(brand, body, (saved) =>
      upsertBackendProduct(toBrandCommerceProduct(brand, saved)),
    )
    await appendChangelog({
      user: "admin",
      action: "create",
      resource: `brand-product:${brand}`,
      target: product.slug,
      summary: `新增${brand === "toshiba" ? "东芝" : "美的"}商品「${product.model}」`,
    })
    return Response.json(product, { status: 201 })
  } catch (error) {
    const status = error instanceof AdminBackendSyncError ? 502 : 400
    return Response.json({ error: (error as Error).message }, { status })
  }
}
