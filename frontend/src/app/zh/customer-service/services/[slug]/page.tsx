import { notFound } from "next/navigation"
import { findContentPage, pagesByFamily } from "@/lib/pages"
import { ContentPage } from "@/components/ContentPage"
import { SiteLayout } from "@/components/SiteLayout"
import { getLocale } from "@/i18n/server"

export const dynamicParams = false

export function generateStaticParams() {
  return pagesByFamily("customer-service")
    .filter(
      (page) =>
        page.url.startsWith("/zh/customer-service/services/") &&
        page.url.split("/").filter(Boolean).length === 5,
    )
    .map((page) => ({
      slug: page.url.split("/").filter(Boolean).at(-1) ?? "",
    }))
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getLocale()
  const page = findContentPage(`/zh/customer-service/services/${slug}/`, locale)
  if (!page) notFound()

  return (
    <SiteLayout>
      <ContentPage page={page} />
    </SiteLayout>
  )
}
