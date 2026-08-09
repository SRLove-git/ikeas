import { adminGuard } from "@/lib/admin-auth";
import { listChangelog } from "@/lib/admin-store";

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  return Response.json({ items: listChangelog() });
}
