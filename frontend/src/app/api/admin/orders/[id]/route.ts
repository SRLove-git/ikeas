import { adminGuard } from "@/lib/admin-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function adminKey(): string {
  return process.env.IKEA_ADMIN_KEY ?? "ikea-admin";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const target = `${API_BASE}/api/v1/admin/orders/${encodeURIComponent(id)}`;
  const response = await fetch(target, {
    headers: { "X-Admin-Key": adminKey() },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const raw = await request.text();
  const target = `${API_BASE}/api/v1/admin/orders/${encodeURIComponent(id)}`;
  const response = await fetch(target, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey(),
    },
    body: raw,
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { id } = await params;
  const target = `${API_BASE}/api/v1/admin/orders/${encodeURIComponent(id)}`;
  const response = await fetch(target, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey() },
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}
