import { adminGuard } from "@/lib/admin-auth";

/**
 * Proxies operational admin requests (users, carts, favorites, chat) to the
 * Spring Boot backend, injecting the admin key server-side so it never leaks
 * into the browser.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function adminKey(): string {
  return process.env.IKEA_ADMIN_KEY ?? "ikea-admin";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const url = new URL(request.url);
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}${url.search}`;
  const response = await fetch(target, {
    headers: { "X-Admin-Key": adminKey() },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}`;
  const response = await fetch(target, {
    method: "DELETE",
    headers: { "X-Admin-Key": adminKey() },
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const guard = await adminGuard();
  if (guard) return guard;
  const { path } = await params;
  const raw = await request.text();
  const target = `${API_BASE}/api/v1/admin/${path.join("/")}`;
  const response = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": adminKey(),
    },
    body: raw,
  });
  const body = await response.json().catch(() => null);
  return Response.json(body, { status: response.status });
}
