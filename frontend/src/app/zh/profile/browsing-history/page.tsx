import { catalogData } from "@/data/catalog"
import { BrowsingHistoryPanel } from "@/components/BrowsingHistoryPanel"
import { SiteLayout } from "@/components/SiteLayout"
import { getLocale } from "@/i18n/server"

export default async function BrowsingHistoryPage() {
  const locale = await getLocale()
  const { catalogCategories } = catalogData(locale)
  const products = [
    ...new Map(
      catalogCategories
        .flatMap((category) => category.products)
        .map((product) => [product.id, product]),
    ).values(),
  ]

  return (
    <SiteLayout>
      <BrowsingHistoryPanel products={products} />
    </SiteLayout>
  )
}
