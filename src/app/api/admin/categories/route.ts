import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, getCategories, updateCategories } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  return Response.json(getCategories());
}

export async function PUT(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const data = await updateCategories(body);
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "categories",
      target: "catalog",
      summary: "更新商品分类",
    });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
