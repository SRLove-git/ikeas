import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { LOCALE_STORAGE_KEY } from "@/i18n/config"

/**
 * Locale path structure: `/zh/*` is the canonical Chinese storefront and
 * `/en/*` renders the same pages in English. `/en/*` rewrites to `/zh/*`
 * while pinning the locale cookie, so server rendering and client hydration
 * both resolve to English. Legacy `/cn/zh/*` URLs redirect to `/zh/*`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/cn" || pathname.startsWith("/cn/")) {
    const target = pathname.replace(/^\/cn(?:\/zh)?/, "/zh") || "/zh"
    return NextResponse.redirect(new URL(target, request.url), 308)
  }

  if (pathname.startsWith("/en")) {
    const target = pathname.replace(/^\/en/, "/zh")
    const response = NextResponse.rewrite(new URL(target, request.url))
    response.cookies.set(LOCALE_STORAGE_KEY, "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/en/:path*", "/cn/:path*", "/en", "/cn"],
}
