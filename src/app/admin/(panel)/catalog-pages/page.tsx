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

interface CatalogPageItem {
  url: string;
  name: string;
  description: string | null;
  total: number;
}

function slugOf(url: string): string {
  return url.split("/").filter(Boolean).at(-1) ?? "";
}

export default function CatalogPagesPage() {
  const [items, setItems] = useState<CatalogPageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ items: CatalogPageItem[] }>(
          "/api/admin/catalog-pages",
        );
        setItems(data.items);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title="分类落地页"
        description="管理分类页 / 频道页的标题、描述、区块与推荐商品。"
        actions={
          <Link href="/admin/catalog-pages/new">
            <Button>新建落地页</Button>
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
          <EmptyState>暂无落地页</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">名称</th>
                <th className="px-5 py-3 font-medium">描述</th>
                <th className="px-5 py-3 font-medium">商品数</th>
                <th className="px-5 py-3 font-medium">URL</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {items.map((page) => (
                <tr key={page.url} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3 font-medium text-ikea-black">{page.name}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-xs text-ikea-muted">
                    {page.description ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-xs">{page.total}</td>
                  <td className="max-w-[220px] truncate px-5 py-3 font-mono text-xs text-ikea-muted">
                    {page.url}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/catalog-pages/${slugOf(page.url)}`}
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
