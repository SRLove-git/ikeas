import { adminGuard } from "@/lib/admin-auth";
import {
  appendChangelog,
  deleteProduct,
  getProduct,
  productCategories,
  upsertProduct,
} from "@/lib/admin-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return Response.json({ error: "商品不存在" }, { status: 404 });
  return Response.json({ ...product, categories: productCategories(id) });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const product = await upsertProduct(body, id);
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "product",
      target: String(product.id),
      summary: `更新商品「${product.name}」`,
    });
    return Response.json(product);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const removed = await deleteProduct(id);
  if (!removed) return Response.json({ error: "商品不存在" }, { status: 404 });
  await appendChangelog({
    user: "admin",
    action: "delete",
    resource: "product",
    target: id,
    summary: `删除商品 ${id}`,
  });
  return Response.json({ ok: true });
}
