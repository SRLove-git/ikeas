import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, getSettings, updateSettings } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  return Response.json(getSettings());
}

export async function PUT(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  const settings = await updateSettings(body as Partial<ReturnType<typeof getSettings>>);
  await appendChangelog({
    user: "admin",
    action: "update",
    resource: "settings",
    target: "settings",
    summary: "更新网站设置",
  });
  return Response.json(settings);
}
