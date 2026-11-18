import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import "./ikea-components.css"
import { AuthProvider } from "@/lib/auth"
import { getSettings } from "@/lib/admin-store"
import { LanguageProvider } from "@/i18n/LanguageProvider"
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
  // Each deployment has its own brand positioning: the medical catalogue, the
  // home-appliance catalogue, and the group portal.
  const title =
    SITE_SCOPE === "home"
      ? isZh
        ? "CHUNG YIP 家庭生活 - 东芝与美的家电"
        : "CHUNG YIP Home & Living - Toshiba & Midea Appliances"
      : SITE_SCOPE === "portal"
        ? isZh
          ? "CHUNG YIP - 健康与生活，一站直达"
          : "CHUNG YIP - Health and home, one destination"
        : settings.siteName
  const description =
    SITE_SCOPE === "home"
      ? isZh
        ? "东芝与美的冰箱、洗护、厨房、环境与清洁电器，官方渠道正品保障，全岛配送与安装支持。"
        : "Toshiba and Midea refrigeration, laundry, kitchen, air and cleaning appliances with islandwide delivery and installation support."
      : SITE_SCOPE === "portal"
        ? isZh
          ? "CHUNG YIP 品牌门户：统一会员账号，连接医疗健康站与家庭生活站。"
          : "CHUNG YIP group portal: one membership connecting our medical and home stores."
        : settings.siteDescription
  return {
    // Deployment-specific origin so canonical/OG URLs point at the right
    // domain (medical-sg.com / home-sg.com / life-sg.com).
    metadataBase: new URL(SITE_URL),
    title,
    description,
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
      className={`${notoIkeaLatin.variable} ${notoIkeaSc.variable} h-full antialiased`}
    >
      <body className="font-ikea min-h-full flex flex-col">
        <AuthProvider>
          <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
