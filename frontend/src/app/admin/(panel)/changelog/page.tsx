"use client";

import { useEffect, useState } from "react";
import {
  adminFetch,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";

interface ChangelogEntry {
  id: string;
  at: string;
  user: string;
  action: "create" | "update" | "delete";
  resource: string;
  target: string;
  summary: string;
}

const ACTION_LABEL: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
};

const ACTION_COLOR: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};

const RESOURCE_LABEL: Record<string, string> = {
  product: "商品",
  page: "页面",
  homepage: "首页",
  menu: "菜单",
  categories: "分类",
  "catalog-page": "落地页",
  order: "订单",
  settings: "设置",
};

export default function ChangelogPage() {
  const [items, setItems] = useState<ChangelogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ items: ChangelogEntry[] }>("/api/admin/changelog");
        setItems(data.items);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader title="操作日志" description="后台所有内容修改的记录（最多保留 200 条）。" />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!items ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState>暂无操作记录</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
                <th className="px-5 py-3 font-medium">对象</th>
                <th className="px-5 py-3 font-medium">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {items.map((entry) => (
                <tr key={entry.id} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {new Date(entry.at).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        ACTION_COLOR[entry.action] ?? "bg-ikea-gray-100 text-ikea-muted"
                      }`}
                    >
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {RESOURCE_LABEL[entry.resource] ?? entry.resource}
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-ikea-black">{entry.summary}</div>
                    <div className="text-xs text-ikea-muted">{entry.target}</div>
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
