import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, getHomepage, updateHomepage } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  return Response.json(getHomepage());
}

export async function PUT(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as {
    updates?: Record<string, unknown>;
  } | null;
  if (!body?.updates) return Response.json({ error: "缺少 updates" }, { status: 400 });
  try {
    const data = await updateHomepage(body.updates);
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "homepage",
      target: "homepage",
      summary: `更新首页字段: ${Object.keys(body.updates).join(", ")}`,
    });
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
