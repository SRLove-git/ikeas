import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { SiteImage } from "@/components/SiteImage";
import { allProducts } from "@/data/products-index";
import { formatPrice } from "@/lib/catalog";
import { catalogPages } from "@/lib/catalog-pages";
import { API_BASE } from "@/lib/api";

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  productType: string | null;
  price: number | null;
  image: string | null;
  labels: { text: string; backgroundColor?: string | null; textColor?: string | null }[];
}

export const dynamic = "force-dynamic";

/** Search the Spring Boot backend; returns null when it is unreachable. */
async function searchBackend(keyword: string): Promise<SearchResult[] | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/products?q=${encodeURIComponent(keyword)}&page=0&size=100`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : null;
  } catch {
    return null;
  }
}

export default async function SearchProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const keyword = q.trim().toLowerCase();

  /** productId -> Chinese category names (from crawled category pages) */
  const categoryNamesById = new Map<string, Set<string>>();
  for (const page of catalogPages()) {
    if (!page.name) continue;
    for (const product of page.products) {
      if (!categoryNamesById.has(product.id)) {
        categoryNamesById.set(product.id, new Set());
      }
      categoryNamesById.get(product.id)!.add(page.name);
    }
  }

  const backendResults = keyword ? await searchBackend(keyword) : null;
  const results: SearchResult[] =
    keyword && backendResults === null
      ? allProducts().filter((product) => {
          const fields = [
            product.name,
            product.productType,
            product.designText,
            ...(categoryNamesById.get(product.id) ?? []),
          ];
          return fields
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(keyword));
        })
      : (backendResults ?? []);

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-8 lg:px-10">
          <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
            <Link href="/" className="hover:text-ikea-black">
              首页
            </Link>
            <span>/</span>
            <span className="text-ikea-black">搜索</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9 lg:text-3xl">
            {keyword ? `搜索“${q}”` : "搜索商品"}
          </h1>

          <form
            role="search"
            className="mt-6 flex max-w-2xl gap-3"
            action="/cn/zh/search/products"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="搜索商品、系列或品类"
              className="h-11 flex-1 border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
            />
            <button
              type="submit"
              className="i-btn i-btn--primary h-11 px-8 text-sm font-bold text-white"
            >
              搜索
            </button>
          </form>

          {keyword ? (
            <>
              <p className="mt-8 text-sm text-ikea-muted">
                共找到 {results.length} 件相关商品
              </p>

              {results.length > 0 ? (
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/cn/zh/p/${product.slug}/`}
                      className="group flex flex-col"
                    >
                      <SiteImage
                        src={product.image}
                        alt={product.name}
                        className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="flex flex-col pt-3">
                        {product.labels.length > 0 ? (
                          <div className="mb-1.5 flex flex-wrap gap-1">
                            {product.labels.slice(0, 2).map((label) => (
                              <span
                                key={label.text}
                                className="inline-block px-1.5 py-0.5 text-[10px] font-bold leading-[10px]"
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
                        <h3 className="text-sm font-bold leading-[18px]">
                          {product.name}
                        </h3>
                        <p className="mt-0.5 text-xs leading-[18px] text-ikea-muted">
                          {product.productType || ""}
                        </p>
                        <p className="mt-1.5 text-sm">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-16 text-center">
                  <p className="text-sm text-ikea-muted">
                    没有找到与“{q}”相关的商品,试试其他关键词。
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["沙发", "衣柜", "台灯", "收纳", "床垫"].map((suggestion) => (
                      <Link
                        key={suggestion}
                        href={`/cn/zh/search/products?q=${encodeURIComponent(suggestion)}`}
                        className="i-pill i-pill--small"
                      >
                        {suggestion}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-16 text-center text-sm text-ikea-muted">
              输入关键词,搜索宜家商品
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
