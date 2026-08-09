import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, getAdminConfig, verifySessionToken } from "@/lib/admin-auth";

export async function GET() {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return Response.json({ user: null });
  }
  const { username } = getAdminConfig();
  return Response.json({ user: { name: username } });
}
