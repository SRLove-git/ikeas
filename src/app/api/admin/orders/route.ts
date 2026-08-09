import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, listOrders, upsertOrder } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  const items = listOrders();
  return Response.json({ items, total: items.length });
}

export async function POST(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const order = await upsertOrder(body);
    await appendChangelog({
      user: "admin",
      action: "create",
      resource: "order",
      target: String(order.id),
      summary: `创建订单 ${order.id}`,
    });
    return Response.json(order, { status: 201 });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}
