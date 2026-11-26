import type { Metadata } from "next"
import { headers } from "next/headers"
import localFont from "next/font/local"
import "./globals.css"
import "./ikea-components.css"
import { AuthProvider } from "@/lib/auth"
import { getSettings } from "@/lib/admin-store"
import { LanguageProvider } from "@/i18n/LanguageProvider"
import {
  PORTAL_LOCALE_PATHS,
  PORTAL_PATH_REQUEST_HEADER,
  portalAlternatePath,
} from "@/i18n/config"
import { getLocale } from "@/i18n/server"
import { SITE_SCOPE, SITE_URL } from "@/lib/site-scope"

const notoIkeaLatin = localFont({
  src: [
    {
      path: "./fonts/noto-ikea-400.latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/noto-ikea-700.latin.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/noto-ikea-400i.latin.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/noto-ikea-700i.latin.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-ikea-latin",
  display: "swap",
})

const notoSerifPortal = localFont({
  src: [
    {
      path: "./fonts/noto-serif-portal-400.subset.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/noto-serif-portal-400-italic.subset.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-portal-serif-latin",
  display: "swap",
  adjustFontFallback: false,
})

const notoSerifScPortal = localFont({
  src: "./fonts/noto-serif-sc-portal-400.subset.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-portal-serif-sc",
  display: "swap",
  adjustFontFallback: false,
})

const notoIkeaSc = localFont({
  src: [
    {
      path: "./fonts/NotoIKEASimplifiedChinese-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/NotoIKEASimplifiedChinese-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-ikea-sc",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const settings = getSettings(locale)
  const isZh = locale === "zh-CN"
  const requestHeaders = SITE_SCOPE === "portal" ? await headers() : null
  const portalPath =
    requestHeaders?.get(PORTAL_PATH_REQUEST_HEADER) ??
    (isZh ? PORTAL_LOCALE_PATHS["zh-CN"] : PORTAL_LOCALE_PATHS.en)
  const canonical = SITE_SCOPE === "portal" ? portalPath : "/"
  // Each deployment has its own brand positioning: the medical catalogue, the
  // home-appliance catalogue, and the group portal.
  const title =
    SITE_SCOPE === "home"
      ? isZh
        ? "CHUNG YIP 家庭生活 - 东芝与美的家电"
        : "CHUNG YIP Home & Living - Toshiba & Midea Appliances"
      : SITE_SCOPE === "portal"
        ? isZh
          ? "CHUNG YIP - 让健康与理想生活，自然相连"
          : "CHUNG YIP - Health and home, better connected"
        : settings.siteName
  const description =
    SITE_SCOPE === "home"
      ? isZh
        ? "东芝与美的冰箱、洗护、厨房、环境与清洁电器，官方渠道正品保障，全岛配送与安装支持。"
        : "Toshiba and Midea refrigeration, laundry, kitchen, air and cleaning appliances with islandwide delivery and installation support."
      : SITE_SCOPE === "portal"
        ? isZh
          ? "CHUNG YIP 旗下医疗健康与家庭生活双站入口。"
          : "CHUNG YIP Singapore connects health monitoring, respiratory care and home appliances, with delivery and warranty support."
        : settings.siteDescription
  return {
    // Deployment-specific origin so canonical/OG URLs point at the right
    // domain (medical-sg.com / home-sg.com / life-sg.com).
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates:
      SITE_SCOPE === "portal"
        ? {
            canonical,
            languages: {
              en: portalAlternatePath(portalPath, "en"),
              "zh-CN": portalAlternatePath(portalPath, "zh-CN"),
              "x-default": portalAlternatePath(portalPath, "en"),
            },
          }
        : { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
      siteName: "CHUNG YIP",
      locale: isZh ? "zh_SG" : "en_SG",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    icons: {
      icon: "/seo/favicon.ico",
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  return (
    <html
      lang={locale}
      className={`${notoIkeaLatin.variable} ${notoIkeaSc.variable} ${notoSerifPortal.variable} ${notoSerifScPortal.variable} h-full antialiased`}
    >
      <body className="font-ikea min-h-full flex flex-col">
        <AuthProvider>
          <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
