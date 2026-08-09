import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, deletePage, getPage, upsertPage } from "@/lib/admin-store";

function decodeKey(key: string): string {
  for (const encoding of ["base64url", "base64"] as const) {
    try {
      const text = Buffer.from(key, encoding).toString("utf8");
      if (text.startsWith("/")) return text;
    } catch {
      // try next encoding
    }
  }
  return key;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { key } = await params;
  const url = decodeKey(key);
  const page = getPage(url);
  if (!page) return Response.json({ error: "页面不存在" }, { status: 404 });
  return Response.json(page);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { key } = await params;
  const url = decodeKey(key);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const page = await upsertPage(body, url);
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "page",
      target: String(page.url),
      summary: `更新页面「${page.title}」`,
    });
    return Response.json(page);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { key } = await params;
  const url = decodeKey(key);
  const removed = await deletePage(url);
  if (!removed) return Response.json({ error: "页面不存在" }, { status: 404 });
  await appendChangelog({
    user: "admin",
    action: "delete",
    resource: "page",
    target: url,
    summary: `删除页面 ${url}`,
  });
  return Response.json({ ok: true });
}
