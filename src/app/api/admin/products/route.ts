import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, listProducts, upsertProduct } from "@/lib/admin-store";

export async function GET(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50) || 50));
  const all = listProducts(q);
  const items = all.slice((page - 1) * pageSize, page * pageSize);
  return Response.json({ items, total: all.length, page, pageSize });
}

export async function POST(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const product = await upsertProduct(body);
    await appendChangelog({
      user: "admin",
      action: "create",
      resource: "product",
      target: String(product.id),
      summary: `创建商品「${product.name}」`,
    });
    return Response.json(product, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
