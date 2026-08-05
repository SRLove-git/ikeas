import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogCategories } from "@/data/catalog";
import { findCategoryBySlug } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamicParams = false;

export function generateStaticParams() {
  const params: { slug: string }[] = [];
  for (const category of catalogCategories) {
    params.push({ slug: category.slug });
    for (const sub of category.subs) {
      params.push({ slug: sub.slug });
    }
  }
  return params;
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = findCategoryBySlug(slug);
  if (!match) notFound();

  const { category, sub } = match;
  const title = sub?.name ?? category.name;
  const products = category.products;
  const parentHref = `/cn/zh/cat/${category.slug}`;

  return (
    <main className="font-ikea min-h-screen bg-white text-ikea-black">
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
        <p className="mt-2 text-sm text-ikea-muted">
          共 {products.length} 件商品
        </p>

        {category.subs.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {category.subs.map((s) => (
              <Link
                key={s.slug}
                href={`/cn/zh/cat/${s.slug}`}
                className={`i-pill i-pill--small ${
                  s.slug === slug ? "i-pill--active" : ""
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
