import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  LOCALE_REQUEST_HEADER,
  LOCALE_STORAGE_KEY,
  PORTAL_PATH_REQUEST_HEADER,
  isLocale,
} from "@/i18n/config"

import { adminPath, isAdminSite } from "@/lib/admin-sites"
import { PORTAL_URL, SITE_SCOPE } from "@/lib/site-scope"

function adminRoute(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const satellite = Boolean(process.env.NEXT_PUBLIC_SITE_SCOPE) && SITE_SCOPE !== "portal"
  if (pathname.startsWith("/api/admin/") || pathname === "/api/admin") {
    return satellite ? new NextResponse(null, { status: 404 }) : NextResponse.next()
  }
  const [, , first = "", ...rest] = pathname.replace(/\/+$/, "").split("/")
  const site = isAdminSite(first) ? first : satellite ? SITE_SCOPE : "portal"
  const section = (isAdminSite(first) ? rest : [first, ...rest]).filter(Boolean).join("/")
  let target: string
  if (first === "login") {
    if (!satellite) return NextResponse.next()
    target = `/admin/login/?next=${encodeURIComponent(adminPath(site))}`
  } else {
    target = adminPath(site, section || "homepage") + search
  }
  if (satellite || target !== pathname + search) {
    const onPortal = request.headers.get("host") === new URL(PORTAL_URL).host
    return NextResponse.redirect(new URL(target, satellite || onPortal ? PORTAL_URL : request.url))
  }
  const headers = new Headers(request.headers)
  headers.set("x-admin-path", pathname)
  return NextResponse.next({ request: { headers } })
}

function localeNext(request: NextRequest, locale: "en" | "zh-CN" | "ms" | "id") {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale)
  if (SITE_SCOPE === "portal") requestHeaders.set(PORTAL_PATH_REQUEST_HEADER, request.nextUrl.pathname)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.cookies.set(LOCALE_STORAGE_KEY, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  })
  return response
}

function localeRewrite(request: NextRequest, pathname: string, locale: "en" | "zh-CN" | "ms" | "id") {
  const target = request.nextUrl.clone()
  target.pathname = pathname
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale)
  if (SITE_SCOPE === "portal") requestHeaders.set(PORTAL_PATH_REQUEST_HEADER, request.nextUrl.pathname)
  const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } })
  response.cookies.set(LOCALE_STORAGE_KEY, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  })
  return response
}

/**
 * Locale path structure: `/zh/*` is the storefront's shared internal route and
 * `/en/*`, `/ms/*`, `/id/*` render the same pages in English, Malay, and
 * Indonesian. Each locale path rewrites to `/zh/*` while pinning the locale
 * cookie, so server rendering and client hydration both resolve to the
 * requested language. Legacy `/cn/zh/*` URLs redirect to `/zh/*`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname === "/api/admin"
  ) {
    return adminRoute(request)
  }

  const normalizedPath = pathname === "/" ? pathname : pathname.replace(/\/+$/, "")

  if (SITE_SCOPE === "portal") {
    if (normalizedPath === "/") {
      if (isLocale(request.headers.get(LOCALE_REQUEST_HEADER))) return NextResponse.next()
      const target = request.nextUrl.clone()
      target.pathname = "/en/"
      return NextResponse.redirect(target, 308)
    }
    if (normalizedPath === "/en") return localeRewrite(request, "/", "en")
    if (normalizedPath === "/zh") return localeRewrite(request, "/", "zh-CN")
    if (pathname.startsWith("/zh/")) {
      if (isLocale(request.headers.get(LOCALE_REQUEST_HEADER))) return NextResponse.next()
      return localeNext(request, "zh-CN")
    }
    if (normalizedPath === "/ms" || normalizedPath === "/id") {
      const target = request.nextUrl.clone()
      target.pathname = "/en/"
      return NextResponse.redirect(target, 308)
    }
  }

  const localePrefixes: Array<{ prefix: string; locale: "en" | "ms" | "id" }> = [
    { prefix: "/en", locale: "en" },
    { prefix: "/ms", locale: "ms" },
    { prefix: "/id", locale: "id" },
  ]

  if (pathname === "/cn" || pathname.startsWith("/cn/")) {
    const target = request.nextUrl.clone()
    target.pathname = pathname.replace(/^\/cn(?:\/zh)?/, "/zh") || "/zh"
    return NextResponse.redirect(target, 308)
  }

  for (const { prefix, locale } of localePrefixes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const target =
        pathname === prefix || pathname === `${prefix}/` ? "/" : pathname.replace(prefix, "/zh")
      return localeRewrite(request, target, locale)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/zh",
    "/zh/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/en/:path*",
    "/ms/:path*",
    "/id/:path*",
    "/cn/:path*",
    "/en",
    "/ms",
    "/id",
    "/cn",
  ],
}
