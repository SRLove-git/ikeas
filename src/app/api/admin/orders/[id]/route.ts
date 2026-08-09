import { adminGuard } from "@/lib/admin-auth";
import { appendChangelog, deleteOrder, getOrder, upsertOrder } from "@/lib/admin-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const order = getOrder(id);
  if (!order) return Response.json({ error: "订单不存在" }, { status: 404 });
  return Response.json(order);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "请求体不能为空" }, { status: 400 });
  try {
    const order = await upsertOrder(body, id);
    await appendChangelog({
      user: "admin",
      action: "update",
      resource: "order",
      target: String(order.id),
      summary: `更新订单 ${order.id}`,
    });
    return Response.json(order);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const removed = await deleteOrder(id);
  if (!removed) return Response.json({ error: "订单不存在" }, { status: 404 });
  await appendChangelog({
    user: "admin",
    action: "delete",
    resource: "order",
    target: id,
    summary: `删除订单 ${id}`,
  });
  return Response.json({ ok: true });
}
