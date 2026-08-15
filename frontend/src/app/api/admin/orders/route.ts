import { adminGuard } from "@/lib/admin-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function adminKey(): string {
  return process.env.IKEA_ADMIN_KEY ?? "ikea-admin";
}

export async function GET(request: Request) {
  const guard = await adminGuard();
  if (guard) return guard;

  const url = new URL(request.url);
  const target = `${API_BASE}/api/v1/admin/orders${url.search}`;
  const response = await fetch(target, {
    headers: { "X-Admin-Key": adminKey() },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}
