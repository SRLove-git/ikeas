import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, getMenu, updateMenu } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  return Response.json(getMenu());
}

export async function PUT(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as {
    menuPanels?: unknown;
    menuCategories?: unknown;
  } | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  const menu = await updateMenu(body);
  await appendChangelog({
    user: "admin",
    action: "update",
    resource: "menu",
    target: "menu",
    summary: "更新导航菜单",
  });
  return Response.json(menu);
}
