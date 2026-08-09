import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getAdminConfig,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  const { username, password } = getAdminConfig();
  if (!body || body.username !== username || body.password !== password) {
    return Response.json({ error: "账号或密码错误" }, { status: 401 });
  }
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return Response.json({ ok: true, user: { name: username } });
}
