import Link from "next/link"
import { catalogData, type CatalogProduct } from "@/data/catalog"
import { catalogPages } from "@/lib/catalog-pages"
import { allProducts } from "@/data/products-index"
import { ProductCard } from "@/components/ProductCard"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { SiteLayout } from "@/components/SiteLayout"
import { getLocale, getServerT } from "@/i18n/server"
import { mideaCommerceProducts, toshibaCommerceProducts } from "@/data/brand-commerce"
import { SITE_SCOPE, crossSiteUrl, productVisibleInScope } from "@/lib/site-scope"

function toCardProduct(product: {
  id: string
  slug: string
  name: string
  productType: string | null
  designText: string | null
  price: number | null
  image: string | null
  labels: { text: string; backgroundColor: string | null; textColor: string | null }[]
}): CatalogProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    productType: product.productType ?? undefined,
    designText: product.designText ?? undefined,
    price: product.price,
    image: product.image,
    labels: (product.labels ?? []).map((label) => ({
      text: label.text,
      backgroundColor: label.backgroundColor ?? undefined,
      textColor: label.textColor ?? undefined,
    })),
    detail: null,
  }
}

export default async function AllProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  if (SITE_SCOPE === "portal") {
    // The portal has no catalogue of its own: route visitors to the two stores.
    return (
      <SiteLayout>
        <div className="font-ikea min-h-screen bg-white text-ikea-black">
          <div className="max-w-page mx-auto px-5 py-16 lg:px-10">
            <h1 className="text-2xl font-bold leading-9 lg:text-3xl">所有商品</h1>
            <p className="mt-2 text-sm text-ikea-muted">请选择要前往的站点浏览商品目录。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={crossSiteUrl("medical", "/zh/all-products/")}
                className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white"
              >
                医疗健康
              </a>
              <a
                href={crossSiteUrl("home", "/zh/all-products/")}
                className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white"
              >
                家庭生活
              </a>
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  const locale = await getLocale()
  const t = await getServerT(locale)
  const { catalogCategories } = catalogData(locale)
  // Never list the other storefront's products, even if a CMS page or category
  // accidentally mixes them in.
  const all = allProducts(locale).filter((product) => productVisibleInScope(product))

  // 分类筛选：只保留有在售商品的分类，空分类不再展示
  const categoryMap = new Map<string, { name: string; products: CatalogProduct[] }>()
  if (SITE_SCOPE === "home") {
    categoryMap.set("midea", {
      name: locale === "zh-CN" ? "美的 Midea" : "Midea",
      products: mideaCommerceProducts(locale).map(toCardProduct),
    })
    categoryMap.set("toshiba", {
      name: locale === "zh-CN" ? "东芝 Toshiba" : "Toshiba",
      products: toshibaCommerceProducts(locale).map(toCardProduct),
    })
  } else {
    for (const category of catalogCategories) {
      const products = category.products.filter((product) => productVisibleInScope(product))
      if (products.length > 0) {
        categoryMap.set(category.slug, { name: category.name, products })
      }
    }
    for (const page of catalogPages(locale)) {
      const slug = page.url.split("/").filter(Boolean).at(-1) ?? ""
      if (categoryMap.has(slug)) continue
      const ids = new Set(page.productIds ?? [])
      const products = all.filter((product) => ids.has(product.id))
      if (products.length > 0) {
        categoryMap.set(slug, { name: page.name, products: products.map(toCardProduct) })
      }
    }
  }

  const filters = [...categoryMap.entries()].map(([slug, { name, products }]) => ({
    slug,
    name,
    count: products.length,
  }))
  const active = cat && categoryMap.has(cat) ? cat : null
  const visible = active ? (categoryMap.get(active)?.products ?? []) : all.map(toCardProduct)

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <Breadcrumbs currentLabel={t("allProducts.currentLabel")} />
          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{t("allProducts.title")}</h1>
          <p className="mt-2 text-sm text-ikea-muted">
            {t("allProducts.itemsCount", { count: all.length })}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/zh/all-products/"
              className={`i-pill i-pill--small ${!active ? "i-pill--active" : ""}`}
            >
              {t("allProducts.all")}
            </Link>
            {filters.map((filter) => (
              <Link
                key={filter.slug}
                href={`/zh/all-products/?cat=${filter.slug}`}
                className={`i-pill i-pill--small ${active === filter.slug ? "i-pill--active" : ""}`}
              >
                {filter.name}（{filter.count}）
              </Link>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
