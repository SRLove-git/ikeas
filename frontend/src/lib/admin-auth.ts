import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "ikea_admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface AdminConfig {
  username: string;
  password: string;
  secret: string;
}

export function getAdminConfig(): AdminConfig {
  return {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "admin123",
    secret: process.env.ADMIN_SECRET ?? "ikea-admin-secret",
  };
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(now: number = Date.now()): string {
  const { username, secret } = getAdminConfig();
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: now + SESSION_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const { username, secret } = getAdminConfig();
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;
  if (!timingSafeEqual(expected, actual)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: string;
      exp?: number;
    };
    if (data.u !== username) return false;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

/** Returns a 401 Response when the request is not an authenticated admin. */
export async function adminGuard(): Promise<Response | null> {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value)) {
    return Response.json({ error: "未登录或会话已过期" }, { status: 401 });
  }
  return null;
}
