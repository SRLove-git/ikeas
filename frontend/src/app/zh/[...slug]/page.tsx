import { notFound } from "next/navigation"
import { ContentPage } from "@/components/ContentPage"
import { SiteLayout } from "@/components/SiteLayout"
import { contentPages } from "@/data/pages-index"
import { findContentPage, isHandledBySpecificRoute } from "@/lib/pages"
import { getLocale } from "@/i18n/server"

export const dynamicParams = false

export function generateStaticParams() {
  return contentPages()
    .filter((page) => !isHandledBySpecificRoute(page.url))
    .map((page) => ({
      slug: page.url.replace("/zh/", "").replace(/\/+$/, "").split("/"),
    }))
}

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const url = `/zh/${slug.join("/")}`
  const locale = await getLocale()
  const page = findContentPage(url, locale)
  if (!page) notFound()

  return (
    <SiteLayout>
      <ContentPage page={page} />
    </SiteLayout>
  )
}
