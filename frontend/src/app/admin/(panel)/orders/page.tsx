"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminFetch,
  Button,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";

interface OrderItem {
  id: string;
  date: string;
  status: string;
  customer?: string | null;
  items: { productId: string; qty: number }[];
}

export default function OrdersPage() {
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ items: OrderItem[] }>("/api/admin/orders");
        setItems(data.items);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const statusColor = (status: string) => {
    if (status.includes("待")) return "bg-amber-100 text-amber-700";
    if (status.includes("完成") || status.includes("已")) return "bg-green-100 text-green-700";
    return "bg-ikea-gray-100 text-ikea-muted";
  };

  return (
    <div>
      <PageHeader
        title="订单管理"
        description="管理网站演示订单（「我的订单」页面数据源）。"
        actions={
          <Link href="/admin/orders/new">
            <Button>新建订单</Button>
          </Link>
        }
      />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!items ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState>暂无订单</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">订单号</th>
                <th className="px-5 py-3 font-medium">日期</th>
                <th className="px-5 py-3 font-medium">客户</th>
                <th className="px-5 py-3 font-medium">商品数</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {items.map((order) => (
                <tr key={order.id} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-ikea-black">
                    {order.id}
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">{order.date}</td>
                  <td className="px-5 py-3 text-xs">{order.customer ?? "—"}</td>
                  <td className="px-5 py-3 text-xs">
                    {order.items.reduce((sum, item) => sum + item.qty, 0)} 件
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs font-medium text-ikea-blue hover:underline"
                    >
                      编辑
                    </Link>
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
