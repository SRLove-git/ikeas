"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteImage } from "@/components/SiteImage";
import { useAuth } from "@/lib/auth";
import {
  apiJson,
  type Cart,
  type OrderResponse,
} from "@/lib/api";
import { formatPrice } from "@/lib/catalog-format";

const DELIVERY_FEE = 9.9;

export function CheckoutPanel() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    phone: "",
    region: "",
    detail: "",
  });

  useEffect(() => {
    if (ready && !user) {
      router.replace("/cn/zh/profile/login/");
      return;
    }
    if (!ready || !user) return;

    let cancelled = false;
    const loadCart = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiJson<Cart>("/cart");
        if (!cancelled) setCart(data);
      } catch (ex) {
        if (!cancelled) {
          setError(ex instanceof Error ? ex.message : "加载购物袋失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadCart();
    return () => {
      cancelled = true;
    };
  }, [ready, user, router]);

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.price ?? 0) * item.quantity,
    0,
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    if (!cart || cart.items.length === 0) {
      setError("购物袋为空，无法提交订单");
      return;
    }
    if (!form.customer.trim() || !form.phone.trim() || !form.region.trim() || !form.detail.trim()) {
      setError("请完整填写收货人、手机号和收货地址");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const order = await apiJson<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify({
          fromCart: true,
          deliveryFee: DELIVERY_FEE,
          customer: form.customer.trim(),
          phone: form.phone.trim(),
          address: `${form.region.trim()} ${form.detail.trim()}`.trim(),
          remark: "",
        }),
      });
      router.replace(
        `/cn/zh/profile/my-orders/?created=${encodeURIComponent(order.orderNo)}`,
      );
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "提交订单失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        正在进入结算…
      </div>
    );
  }

  return (
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
                  value={form.customer}
                  onChange={(event) => update("customer", event.target.value)}
                  placeholder="收货人姓名"
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                />
                <input
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="手机号"
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                />
                <input
                  value={form.region}
                  onChange={(event) => update("region", event.target.value)}
                  placeholder="省 / 市 / 区"
                  className="h-11 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue sm:col-span-2"
                />
                <input
                  value={form.detail}
                  onChange={(event) => update("detail", event.target.value)}
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
                <span className="text-sm font-bold">{formatPrice(DELIVERY_FEE)}</span>
              </label>
            </section>
          </div>

          <aside className="h-fit bg-white p-6">
            <h2 className="text-base font-bold">订单摘要</h2>

            {loading ? (
              <p className="py-10 text-center text-sm text-ikea-muted">加载购物袋…</p>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-ikea-muted">购物袋还是空的</p>
                <Link
                  href="/cn/zh/all-products/"
                  className="mt-3 inline-block text-sm font-bold text-ikea-blue hover:underline"
                >
                  去挑选商品
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-3">
                      <SiteImage
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 bg-white"
                        imgClassName="h-full w-full object-contain object-[50%_20%]"
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="line-clamp-1 text-sm font-bold">{product.name}</span>
                        <span className="mt-0.5 text-xs text-ikea-muted">数量 {quantity}</span>
                        <span className="mt-auto text-sm font-bold">
                          {formatPrice((product.price ?? 0) * quantity)}
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
                    <span>{formatPrice(DELIVERY_FEE)}</span>
                  </div>
                  <div className="flex justify-between border-t border-ikea-gray-200 pt-3 text-base font-bold">
                    <span>合计</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || loading || totalQuantity === 0}
                  className="i-btn i-btn--primary mt-6 h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "提交中…" : "提交订单"}
                </button>
                <p className="mt-3 text-center text-xs text-ikea-muted">
                  提交后将由 BUZUD 商城后台生成订单
                </p>
              </>
            )}

            {error ? (
              <p className="mt-4 rounded bg-red-50 px-4 py-3 text-center text-xs text-red-600">
                {error}
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
