import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { LOCALE_STORAGE_KEY } from "@/i18n/config"

/**
 * Locale path structure: `/zh/*` is the storefront's shared internal route and
 * `/en/*`, `/ms/*`, `/id/*` render the same pages in English, Malay, and
 * Indonesian. Each locale path rewrites to `/zh/*` while pinning the locale
 * cookie, so server rendering and client hydration both resolve to the
 * requested language. Legacy `/cn/zh/*` URLs redirect to `/zh/*`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const localePrefixes: Array<{ prefix: string; locale: "en" | "ms" | "id" }> = [
    { prefix: "/en", locale: "en" },
    { prefix: "/ms", locale: "ms" },
    { prefix: "/id", locale: "id" },
  ]

  if (pathname === "/cn" || pathname.startsWith("/cn/")) {
    const target = pathname.replace(/^\/cn(?:\/zh)?/, "/zh") || "/zh"
    return NextResponse.redirect(new URL(target, request.url), 308)
  }

  for (const { prefix, locale } of localePrefixes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const target =
        pathname === prefix || pathname === `${prefix}/` ? "/" : pathname.replace(prefix, "/zh")
      const response = NextResponse.rewrite(new URL(target, request.url))
      response.cookies.set(LOCALE_STORAGE_KEY, locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/en/:path*", "/ms/:path*", "/id/:path*", "/cn/:path*", "/en", "/ms", "/id", "/cn"],
}
