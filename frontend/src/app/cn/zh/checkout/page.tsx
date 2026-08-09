import Link from "next/link";
import { SiteLayout } from "@/components/SiteLayout";
import { SiteImage } from "@/components/SiteImage";
import { allProducts } from "@/data/products-index";
import { formatPrice } from "@/lib/catalog";

export default function CheckoutPage() {
  const items = allProducts().slice(0, 2).map((product, index) => ({
    product,
    qty: index + 1,
  }));
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.qty,
    0,
  );
  const delivery = 9.9;
  const total = subtotal + delivery;

  return (
    <SiteLayout>
      <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
        <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
          <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
            <Link href="/" className="hover:text-ikea-black">
              首页
            </Link>
            <span>/</span>
            <span className="text-ikea-black">结算</span>
          </nav>

          <h1 className="text-2xl font-bold leading-9">结算</h1>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {/* steps */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-ikea-blue">1 收货信息</span>
                <span className="text-ikea-gray-300">›</span>
                <span className="text-ikea-muted">2 配送方式</span>
                <span className="text-ikea-gray-300">›</span>
                <span className="text-ikea-muted">3 支付</span>
              </div>

              <section className="bg-white p-6">
                <h2 className="text-base font-bold">收货信息</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input
                    placeholder="收货人姓名"
                    className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                  />
                  <input
                    placeholder="手机号"
                    className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                  />
                  <input
                    placeholder="省 / 市 / 区"
                    className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue sm:col-span-2"
                  />
                  <input
                    placeholder="详细地址"
                    className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue sm:col-span-2"
                  />
                </div>
              </section>

              <section className="bg-white p-6">
                <h2 className="text-base font-bold">配送方式</h2>
                <label className="mt-4 flex cursor-pointer items-center justify-between border border-ikea-gray-200 p-4">
                  <span className="flex items-center gap-3">
                    <input type="radio" name="delivery" defaultChecked className="accent-ikea-blue" />
                    <span>
                      <span className="block text-sm font-bold">标准配送</span>
                      <span className="mt-0.5 block text-xs text-ikea-muted">
                        预计 3-5 个工作日送达
                      </span>
                    </span>
                  </span>
                  <span className="text-sm font-bold">{formatPrice(delivery)}</span>
                </label>
              </section>
            </div>

            <aside className="h-fit bg-white p-6">
              <h2 className="text-base font-bold">订单摘要</h2>
              <div className="mt-4 space-y-4">
                {items.map(({ product, qty }) => (
                  <div key={product.id} className="flex gap-3">
                    <SiteImage
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 shrink-0"
                    />
                    <div className="flex flex-1 flex-col">
                      <span className="line-clamp-1 text-sm font-bold">{product.name}</span>
                      <span className="mt-0.5 text-xs text-ikea-muted">数量 {qty}</span>
                      <span className="mt-auto text-sm font-bold">
                        {formatPrice((product.price ?? 0) * qty)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2 border-t border-ikea-gray-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-ikea-muted">商品小计</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ikea-muted">配送费</span>
                  <span>{formatPrice(delivery)}</span>
                </div>
                <div className="flex justify-between border-t border-ikea-gray-200 pt-3 text-base font-bold">
                  <span>合计</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <button
                type="button"
                className="i-btn i-btn--primary mt-6 h-11 w-full text-sm font-bold text-white"
              >
                提交订单
              </button>
              <p className="mt-3 text-center text-xs text-ikea-muted">
                演示环境:下单功能待后端接入
              </p>
            </aside>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
