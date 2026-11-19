import { cookies, headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin-auth"
import { AdminShell } from "@/components/admin/AdminShell"
import { adminPath, isAdminSite, loginDestination } from "@/lib/admin-sites"

export default async function AdminPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ site: string }>
}) {
  const { site } = await params
  if (!isAdminSite(site)) notFound()
  if (!verifySessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)) {
    const next = loginDestination((await headers()).get("x-admin-path") ?? adminPath(site))
    redirect(`/admin/login/?next=${encodeURIComponent(next)}`)
  }
  return <AdminShell site={site}>{children}</AdminShell>
}
