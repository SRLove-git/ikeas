import { SiteLayout } from "@/components/SiteLayout"
import { CollectionPanel } from "@/components/CollectionPanel"
import { homepage } from "@/data/homepage"
import { allProducts } from "@/data/products-index"

export default function CollectionPage() {
  const inspirationItems = homepage().inspirationTipsItems
  const catalogProducts = allProducts()

  return (
    <SiteLayout>
      <CollectionPanel inspirationItems={inspirationItems} catalogProducts={catalogProducts} />
    </SiteLayout>
  )
}
