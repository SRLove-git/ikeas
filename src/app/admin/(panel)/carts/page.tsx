"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminFetch,
  ConfirmButton,
  EmptyState,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  useNotice,
} from "@/components/admin/admin-ui";

interface CartEntry {
  productId: string;
  quantity: number;
  addedAt: number;
}

interface Cart {
  userId: string;
  user: { name: string; phone?: string | null } | null;
  items: CartEntry[];
}

export default function CartsPage() {
  const { notice, show } = useNotice();
  const [carts, setCarts] = useState<Cart[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ items: Cart[] }>("/api/admin/server/carts");
      setCarts(data.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const clear = async (userId: string) => {
    await adminFetch(`/api/admin/server/carts/${userId}`, { method: "DELETE" });
    show("success", "购物车已清空");
    await load();
  };

  return (
    <div>
      <PageHeader
        title="购物车管理"
        description="查看/清空用户购物袋（Spring Boot 内存存储，重启后重置）。"
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!carts ? (
          <Loading label="连接运营服务…" />
        ) : carts.length === 0 ? (
          <EmptyState>暂无购物车数据</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">商品明细</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {carts.map((cart) => (
                <tr key={cart.userId} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ikea-black">
                      {cart.user?.name ?? "未知用户"}
                    </div>
                    <div className="text-xs text-ikea-muted">{cart.userId}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {cart.items.map((item) => (
                      <div key={item.productId}>
                        {item.productId} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ConfirmButton onConfirm={() => clear(cart.userId)}>
                      清空购物车
                    </ConfirmButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
