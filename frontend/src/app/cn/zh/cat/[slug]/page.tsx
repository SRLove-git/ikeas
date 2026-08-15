import Link from "next/link"
import { notFound } from "next/navigation"
import { catalogData } from "@/data/catalog"
import { findCategoryBySlug } from "@/lib/catalog"
import { ProductCard } from "@/components/ProductCard"
import { SiteImage } from "@/components/SiteImage"
import { catalogPages, findCatalogPageBySlug, productHref } from "@/lib/catalog-pages"
import { productSlugsWithDetails } from "@/lib/catalog"
import { formatPrice } from "@/lib/catalog-format"
import { SiteLayout } from "@/components/SiteLayout"

export const dynamicParams = false

export function generateStaticParams() {
  const params: { slug: string }[] = []
  const seen = new Set<string>()
  const { catalogCategories } = catalogData()
  for (const category of catalogCategories) {
    if (!seen.has(category.slug)) {
      seen.add(category.slug)
      params.push({ slug: category.slug })
    }
    for (const sub of category.subs) {
      if (!seen.has(sub.slug)) {
        seen.add(sub.slug)
        params.push({ slug: sub.slug })
      }
    }
  }
  for (const page of catalogPages()) {
    const slug = page.url.split("/").filter(Boolean).at(-1) ?? ""
    if (slug && !seen.has(slug)) {
      seen.add(slug)
      params.push({ slug })
    }
  }
  return params
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const match = findCategoryBySlug(slug)

  if (match) {
    const { category, sub } = match
    const title = sub?.name ?? category.name
    const products = category.products
    const parentHref = `/cn/zh/cat/${category.slug}`

    return (
      <SiteLayout>
        <div className="font-ikea min-h-screen bg-white text-ikea-black">
          <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
            <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
              <Link href="/" className="hover:text-ikea-black">
                首页
              </Link>
              <span>/</span>
              <Link href="/cn/zh/all-products" className="hover:text-ikea-black">
                所有商品
              </Link>
              {sub ? (
                <>
                  <span>/</span>
                  <Link href={parentHref} className="hover:text-ikea-black">
                    {category.name}
                  </Link>
                </>
              ) : null}
              <span>/</span>
              <span className="text-ikea-black">{title}</span>
            </nav>

            <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-ikea-muted">共 {products.length} 件商品</p>

            {category.subs.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {category.subs.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/cn/zh/cat/${s.slug}`}
                    className={`i-pill i-pill--small ${s.slug === slug ? "i-pill--active" : ""}`}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  const page = findCatalogPageBySlug(slug)
  if (!page) notFound()

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
            <Link href="/" className="hover:text-ikea-black">
              首页
            </Link>
            <span>/</span>
            <Link href="/cn/zh/all-products" className="hover:text-ikea-black">
              所有商品
            </Link>
            <span>/</span>
            <span className="text-ikea-black">{page.name}</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{page.name}</h1>
          {page.description ? (
            <p className="mt-2 text-sm leading-6 text-ikea-muted">{page.description}</p>
          ) : null}
          <p className="mt-2 text-sm text-ikea-muted">共 {page.total} 件商品</p>

          {page.blocks.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {page.blocks
                .flatMap((b) => b.links)
                .slice(0, 12)
                .map((link, i) => (
                  <Link key={`${link.href}-${i}`} href={link.href} className="i-pill i-pill--small">
                    {link.text || "查看"}
                  </Link>
                ))}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {page.products.map((product) => {
              const href = productHref(product)
              const hasDetail = productSlugsWithDetails().has(
                href.split("/").filter(Boolean).at(-1) ?? "",
              )
              const content = (
                <>
                  <div className="aspect-square w-full overflow-hidden bg-white">
                    <SiteImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full p-4"
                      imgClassName="h-full w-full object-contain object-center"
                    />
                  </div>
                  <div className="flex flex-col pt-3">
                    <h3 className="text-sm font-bold leading-[18px] text-ikea-black">
                      {product.name}
                    </h3>
                    {product.measureText || product.designText ? (
                      <p className="mt-0.5 text-xs leading-[18px] text-ikea-muted">
                        {product.measureText || product.designText}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-sm text-ikea-black">{formatPrice(product.price)}</p>
                  </div>
                </>
              )
              return hasDetail ? (
                <Link key={product.id} href={href} className="group flex flex-col">
                  {content}
                </Link>
              ) : (
                <div key={product.id} className="flex flex-col">
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
