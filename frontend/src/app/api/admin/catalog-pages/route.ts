import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, listCatalogPages, upsertCatalogPage } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  const items = listCatalogPages();
  return Response.json({ items, total: items.length });
}

export async function POST(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const page = await upsertCatalogPage(body);
    await appendChangelog({
      user: "admin",
      action: "create",
      resource: "catalog-page",
      target: String(page.url ?? ""),
      summary: `创建落地页「${page.name}」`,
    });
    return Response.json(page, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
