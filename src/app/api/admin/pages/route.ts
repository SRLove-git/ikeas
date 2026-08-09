import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, listPages, pageFamilies, upsertPage } from "@/lib/admin-store";

export async function GET(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const url = new URL(request.url);
  const family = url.searchParams.get("family") ?? undefined;
  const q = url.searchParams.get("q") ?? "";
  const all = listPages(family, q);
  return Response.json({ items: all, total: all.length, families: pageFamilies() });
}

export async function POST(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const page = await upsertPage(body);
    await appendChangelog({
      user: "admin",
      action: "create",
      resource: "page",
      target: String(page.url),
      summary: `创建页面「${page.title}」`,
    });
    return Response.json(page, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
