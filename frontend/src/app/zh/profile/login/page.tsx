import { redirect } from "next/navigation"
import { SITE_SCOPE, loginUrl } from "@/lib/site-scope"
import { LoginForm } from "./LoginForm"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  // The portal owns the account database and SSO entry. medical/home send
  // visitors there with an absolute return URL; requests carrying `sso`/`code`
  // continue into the shared login form / exchange flow.
  const hasSsoParams = params.sso !== undefined || params.code !== undefined
  if (SITE_SCOPE !== "portal" && !hasSsoParams) {
    const rawReturn = params.return
    const returnPath =
      typeof rawReturn === "string" && rawReturn.startsWith("/") && !rawReturn.startsWith("//")
        ? rawReturn
        : "/zh/profile/"
    redirect(loginUrl(returnPath))
  }
  return <LoginForm />
}
