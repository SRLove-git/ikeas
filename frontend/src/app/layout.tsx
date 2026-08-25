import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import "./ikea-components.css"
import { AuthProvider } from "@/lib/auth"
import { getSettings } from "@/lib/admin-store"
import { LanguageProvider } from "@/i18n/LanguageProvider"
import { getLocale } from "@/i18n/server"

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
  return {
    title: settings.siteName,
    description: settings.siteDescription,
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
