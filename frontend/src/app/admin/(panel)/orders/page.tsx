"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminFetch,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/catalog-format";

interface AdminOrderItem {
  productId: string;
  productName: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface AdminOrder {
  id: number;
  orderNo: string;
  userId: number;
  userName: string | null;
  userPhone: string | null;
  status: number;
  statusLabel: string;
  currency: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  customer: string | null;
  phone: string | null;
  address: string | null;
  remark: string | null;
  items: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
}

function statusClassName(status: number): string {
  if (status === 1) return "bg-amber-100 text-amber-700";
  if (status === 2 || status === 3) return "bg-blue-100 text-blue-700";
  if (status === 4) return "bg-green-100 text-green-700";
  return "bg-ikea-gray-100 text-ikea-muted";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
}

export default function OrdersPage() {
  const [items, setItems] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ items: AdminOrder[] }>("/api/admin/orders");
        setItems(data.items);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="订单管理"
        description="查看、修改或取消用户通过前台提交的后端订单。"
      />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!items ? (
          <Loading label="连接订单服务…" />
        ) : items.length === 0 ? (
          <EmptyState>暂无订单</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">订单号</th>
                <th className="px-5 py-3 font-medium">下单时间</th>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">商品数</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {items.map((order) => (
                <tr key={order.orderNo} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-ikea-black">
                    {order.orderNo}
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {order.userName ?? "未知用户"}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)} 件
                  </td>
                  <td className="px-5 py-3 text-xs font-medium">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${statusClassName(order.status)}`}
                    >
                      {order.statusLabel}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.orderNo}`}
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
