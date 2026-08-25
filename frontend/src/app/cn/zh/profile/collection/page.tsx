import { SiteLayout } from "@/components/SiteLayout"
import { CollectionPanel } from "@/components/CollectionPanel"
import { homepage } from "@/data/homepage"
import { allProducts } from "@/data/products-index"
import { getLocale } from "@/i18n/server"

export default async function CollectionPage() {
  const locale = await getLocale()
  const inspirationItems = homepage(locale).inspirationTipsItems
  const catalogProducts = allProducts(locale)

  return (
    <SiteLayout>
      <CollectionPanel inspirationItems={inspirationItems} catalogProducts={catalogProducts} />
    </SiteLayout>
  )
}
