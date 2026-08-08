import Link from "next/link";
import { catalogCategories } from "@/data/catalog";
import { catalogPages } from "@/lib/catalog-pages";

const allCategories = [
  ...catalogCategories.map((category) => ({
    name: category.name,
    href: `/cn/zh/cat/${category.slug}`,
    image: category.image,
    count: category.products.length,
  })),
  ...catalogPages
    .filter(
      (page) =>
        !catalogCategories.some(
          (category) => category.slug === page.url.split("/").filter(Boolean).at(-1),
        ),
    )
    .map((page) => ({
      name: page.name,
      href: page.url,
      image: page.products[0]?.image ?? null,
      count: page.total,
    })),
];

export default function AllProductsPage() {
  return (
    <main className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
        <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <span className="text-ikea-black">所有商品</span>
        </nav>
        <h1 className="text-2xl font-bold leading-9 lg:text-3xl">所有商品</h1>

        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {allCategories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-ikea-gray-100">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-ikea-gray-100" />
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold">{category.name}</span>
                <span className="text-xs text-ikea-muted">
                  {category.count} 件
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
