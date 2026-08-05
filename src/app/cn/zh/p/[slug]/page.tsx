import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogCategories } from "@/data/catalog";
import { findProductBySlug, formatPrice } from "@/lib/catalog";
import { ProductGallery } from "@/components/ProductGallery";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalogCategories.flatMap((category) =>
    category.products.map((product) => ({ slug: product.slug })),
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = findProductBySlug(slug);
  if (!match) notFound();

  const { product, category } = match;
  const detail = product.detail;
  const spec = [product.productType, product.designText].filter(Boolean).join(", ");

  return (
    <main className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <Link href="/cn/zh/all-products" className="hover:text-ikea-black">
            所有商品
          </Link>
          <span>/</span>
          <Link
            href={`/cn/zh/cat/${category.slug}`}
            className="hover:text-ikea-black"
          >
            {category.name}
          </Link>
          <span>/</span>
          <span className="text-ikea-black">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={detail?.images ?? []} name={product.name} />

          <div className="flex flex-col">
            {product.labels.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {product.labels.map((label) => (
                  <span
                    key={label.text}
                    className="inline-block px-2 py-1 text-[11px] font-bold leading-[11px]"
                    style={{
                      backgroundColor: label.backgroundColor ?? "#111111",
                      color: label.textColor ?? "#ffffff",
                    }}
                  >
                    {label.text}
                  </span>
                ))}
              </div>
            ) : null}

            <h1 className="text-2xl font-bold leading-9 lg:text-3xl">
              {product.name}
            </h1>
            {spec ? <p className="mt-1 text-sm text-ikea-muted">{spec}</p> : null}

            <p className="mt-5 text-2xl font-bold">
              {formatPrice(product.price)}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="i-btn i-btn--small i-btn--primary h-11 px-8 text-sm"
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label">加入购物袋</span>
                </span>
              </button>
              <button
                type="button"
                className="i-btn i-btn--small h-11 border border-ikea-black bg-white px-8 text-sm text-ikea-black"
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label">加入收藏</span>
                </span>
              </button>
            </div>

            {detail && detail.benefits.length > 0 ? (
              <ul className="mt-8 space-y-2">
                {detail.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2 text-sm leading-6">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ikea-blue" />
                    {benefit}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {detail ? (
          <div className="mt-14 grid gap-8 border-t border-ikea-gray-200 pt-10 md:grid-cols-2 lg:grid-cols-4">
            {detail.description ? (
              <section>
                <h2 className="mb-3 text-base font-bold">产品描述</h2>
                <p className="text-sm leading-6 text-ikea-muted">
                  {detail.description}
                </p>
              </section>
            ) : null}
            {detail.dimension ? (
              <section>
                <h2 className="mb-3 text-base font-bold">尺寸</h2>
                <p className="text-sm leading-6 text-ikea-muted">
                  {detail.dimension}
                </p>
              </section>
            ) : null}
            {detail.materials.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-bold">材质</h2>
                <ul className="space-y-1 text-sm leading-6 text-ikea-muted">
                  {detail.materials.map((material) => (
                    <li key={material}>· {material}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {detail.care.length > 0 ? (
              <section>
                <h2 className="mb-3 text-base font-bold">保养说明</h2>
                <ul className="space-y-1 text-sm leading-6 text-ikea-muted">
                  {detail.care.map((care) => (
                    <li key={care}>· {care}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
