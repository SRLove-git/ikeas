import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { LOCALE_STORAGE_KEY } from "@/i18n/config"

/**
 * English paths (`/en/*`) always render in English: pin the locale cookie so
 * both server rendering and client hydration resolve to `en`.
 */
export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/en")) {
    return NextResponse.next()
  }
  const response = NextResponse.next()
  response.cookies.set(LOCALE_STORAGE_KEY, "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  return response
}

export const config = {
  matcher: ["/en/:path*"],
}
