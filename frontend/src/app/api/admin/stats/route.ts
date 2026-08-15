import { adminGuard } from "@/lib/admin-auth";
import { siteStats } from "@/lib/admin-store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";

function adminKey(): string {
  return process.env.IKEA_ADMIN_KEY ?? "ikea-admin";
}

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;

  const stats = siteStats();
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/orders`, {
      headers: { "X-Admin-Key": adminKey() },
      cache: "no-store",
    });
    if (response.ok) {
      const body = (await response.json().catch(() => null)) as { total?: number } | null;
      if (body && typeof body.total === "number") {
        stats.orders = body.total;
      }
    }
  } catch {
    // Backend offline: keep the JSON fallback count so the dashboard still renders.
  }

  return Response.json(stats);
}
