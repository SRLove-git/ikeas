import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
});

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
});

export const metadata: Metadata = {
  title:
    "宜家家居官网-家 给生活更多-宜家电商-提供客厅，卧室，厨房，各类家居灵感和产品解决方案- IKEA",
  description:
    "宜家家居官网-家 给生活更多-宜家电商-提供客厅，卧室，厨房，各类家居灵感和产品解决方案- IKEA",
  icons: {
    icon: "/seo/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoIkeaLatin.variable} ${notoIkeaSc.variable} h-full antialiased`}
    >
      <body className="font-ikea min-h-full flex flex-col">{children}</body>
    </html>
  );
}
