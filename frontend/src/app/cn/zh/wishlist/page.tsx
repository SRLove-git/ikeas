import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { SiteImage } from "@/components/SiteImage";
import { allProducts } from "@/data/products-index";
import { formatPrice } from "@/lib/catalog";

export default function WishlistPage() {
  const items = allProducts().slice(0, 8);
  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-white text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
          <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
            <Link href="/" className="hover:text-ikea-black">
              首页
            </Link>
            <span>/</span>
            <Link href="/cn/zh/profile/" className="hover:text-ikea-black">
              我的个人档案
            </Link>
            <span>/</span>
            <span className="text-ikea-black">我的收藏</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9">我的收藏({items.length})</h1>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <Link key={product.id} href={`/cn/zh/p/${product.slug}/`} className="group flex flex-col">
                <div className="relative">
                  <SiteImage
                    src={product.image}
                    alt={product.name}
                    className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    aria-label="取消收藏"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-ikea-red">
                      <path d="M12 21s-7.5-4.7-9.7-9.2C.8 8.8 2.4 5.5 5.6 5.5c1.9 0 3.3 1 4.4 2.4C11.1 6.5 12.5 5.5 14.4 5.5c3.2 0 4.8 3.3 3.3 6.3C19.5 16.3 12 21 12 21z" />
                    </svg>
                  </button>
                </div>
                <h3 className="mt-3 text-sm font-bold leading-5">{product.name}</h3>
                <p className="mt-1 text-sm">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
