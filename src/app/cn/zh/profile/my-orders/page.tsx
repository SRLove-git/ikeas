import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { SiteImage } from "@/components/SiteImage";
import { allProducts } from "@/data/products-index";
import { formatPrice } from "@/lib/catalog";

const orders = [
  {
    id: "20260808001",
    date: "2026-08-08",
    status: "待收货",
    items: [allProducts[0], allProducts[1]],
  },
  {
    id: "20260715002",
    date: "2026-07-15",
    status: "已完成",
    items: [allProducts[2], allProducts[3]],
  },
];

export default function MyOrdersPage() {
  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
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
            <span className="text-ikea-black">我的订单</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9">我的订单</h1>

          <div className="mt-8 space-y-4">
            {orders.map((order) => {
              const total = order.items.reduce((sum, p) => sum + (p.price ?? 0), 0);
              return (
                <section key={order.id} className="bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ikea-gray-200 pb-4">
                    <div className="text-sm">
                      <span className="font-bold">订单号 {order.id}</span>
                      <span className="ml-3 text-ikea-muted">{order.date}</span>
                    </div>
                    <span className="text-sm font-bold text-ikea-blue">{order.status}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex flex-1 gap-3">
                      {order.items.map((product) => (
                        <Link
                          key={product.id}
                          href={`/cn/zh/p/${product.slug}/`}
                          className="w-16 shrink-0"
                        >
                          <SiteImage
                            src={product.image}
                            alt={product.name}
                            className="aspect-square w-full"
                          />
                        </Link>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-ikea-muted">
                        {order.items.length} 件商品
                      </p>
                      <p className="mt-1 text-base font-bold">{formatPrice(total)}</p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
