import { adminGuard } from "@/lib/admin-auth";
import {
  appendChangelog,
  deleteCatalogPage,
  getCatalogPage,
  upsertCatalogPage,
} from "@/lib/admin-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { slug } = await params;
  const page = getCatalogPage(slug);
  if (!page) return Response.json({ error: "落地页不存在" }, { status: 404 });
  return Response.json(page);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { slug } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const page = await upsertCatalogPage(body, slug);
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "catalog-page",
      target: String(page.url ?? ""),
      summary: `更新落地页「${page.name}」`,
    });
    return Response.json(page);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { slug } = await params;
  const removed = await deleteCatalogPage(slug);
  if (!removed) return Response.json({ error: "落地页不存在" }, { status: 404 });
  await appendChangelog({
    user: "admin",
    action: "delete",
    resource: "catalog-page",
    target: slug,
    summary: `删除落地页 ${slug}`,
  });
  return Response.json({ ok: true });
}
