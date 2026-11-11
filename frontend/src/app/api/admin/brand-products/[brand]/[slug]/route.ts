import { adminGuard } from "@/lib/admin-auth"
import { BRANDS, deleteBrandProduct, isBrandId, updateBrandProduct } from "@/lib/brand-store"
import { appendChangelog } from "@/lib/admin-store"
import {
  AdminBackendSyncError,
  deleteBackendProduct,
  upsertBackendProduct,
} from "@/lib/admin-backend"
import { toBrandCommerceProduct } from "@/data/brand-commerce"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ brand: string; slug: string }> },
) {
  const guard = await adminGuard()
  if (guard) return guard

  const { brand, slug } = await params
  if (!isBrandId(brand)) {
    return Response.json({ error: `brand 必须是 ${BRANDS.join(" / ")}` }, { status: 400 })
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 })

  try {
    const product = await updateBrandProduct(brand, decodeURIComponent(slug), body, (saved) =>
      upsertBackendProduct(toBrandCommerceProduct(brand, saved), saved.id),
    )
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: `brand-product:${brand}`,
      target: product.slug,
      summary: `更新${brand === "toshiba" ? "东芝" : "美的"}商品「${product.model}」`,
    })
    return Response.json(product)
  } catch (error) {
    const status = error instanceof AdminBackendSyncError ? 502 : 400
    return Response.json({ error: (error as Error).message }, { status })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ brand: string; slug: string }> },
) {
  const guard = await adminGuard()
  if (guard) return guard

  const { brand, slug } = await params
  if (!isBrandId(brand)) {
    return Response.json({ error: `brand 必须是 ${BRANDS.join(" / ")}` }, { status: 400 })
  }
  try {
    const removed = await deleteBrandProduct(brand, decodeURIComponent(slug), (product) =>
      deleteBackendProduct(product.id),
    )
    await appendChangelog({
      user: "admin",
      action: "delete",
      resource: `brand-product:${brand}`,
      target: removed.slug,
      summary: `删除${brand === "toshiba" ? "东芝" : "美的"}商品「${removed.model}」`,
    })
    return Response.json({ ok: true })
  } catch (error) {
    const status = error instanceof AdminBackendSyncError ? 502 : 400
    return Response.json({ error: (error as Error).message }, { status })
  }
}
