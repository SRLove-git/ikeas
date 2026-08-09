import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogData } from "@/data/catalog";
import { findCategoryBySlug } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";

export const dynamicParams = false;

export function generateStaticParams() {
  const { channelCategories } = catalogData();
  return channelCategories.map((channel) => ({ slug: channel.slug }));
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = findCategoryBySlug(slug);
  if (!match || match.sub) notFound();

  const { category } = match;

  return (
    <main className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
        <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <span className="text-ikea-black">{category.name}</span>
        </nav>

        <h1 className="text-2xl font-bold leading-9 lg:text-3xl">
          {category.name}
        </h1>
        <p className="mt-2 text-sm text-ikea-muted">
          共 {category.products.length} 件商品
        </p>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
