import type { Metadata } from "next"
import { SsoExchangeClient } from "./sso-exchange-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "统一登录",
  robots: { index: false, follow: false },
}

/**
 * 医疗站 / 家庭站的 SSO 落地页：用门户签发的一次性 code 换取本站令牌。
 * 兑换成功后整页跳转到 `next`，由 AuthProvider 从 localStorage 恢复会话。
 */
export default async function SsoPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>
}) {
  const { code, next } = await searchParams
  return <SsoExchangeClient code={code ?? ""} next={next ?? "/zh/profile/"} />
}
