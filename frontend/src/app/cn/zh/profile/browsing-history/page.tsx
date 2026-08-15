import { catalogData } from "@/data/catalog"
import { BrowsingHistoryPanel } from "@/components/BrowsingHistoryPanel"
import { SiteLayout } from "@/components/SiteLayout"

export default function BrowsingHistoryPage() {
  const { catalogCategories } = catalogData()
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
