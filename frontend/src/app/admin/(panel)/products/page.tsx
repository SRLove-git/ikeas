"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  adminFetch,
  Button,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
  Pagination,
  SearchBox,
} from "@/components/admin/admin-ui"
import { formatPrice } from "@/lib/catalog-format"

interface Product {
  id: string
  slug: string
  name: string
  productType?: string | null
  designText?: string | null
  price: number | null
  originalPrice?: number | null
  image: string | null
}

export default function ProductsPage() {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: Product[]; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 50

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await adminFetch<{ items: Product[]; total: number }>(
            `/api/admin/products?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
          )
          setData(result)
          setError(null)
        } catch (e) {
          setError((e as Error).message)
        }
      })()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, page])

  return (
    <div>
      <PageHeader
        title="商品管理"
        description="管理网站展示的全部商品（名称、价格、图片、标签、详情）。"
        actions={
          <Link href="/admin/products/new">
            <Button>新建商品</Button>
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <SearchBox
          value={query}
          onChange={(v) => {
            setPage(1)
            setQuery(v)
          }}
          placeholder="搜索名称 / ID / slug…"
        />
        <span className="text-xs text-ikea-muted">
          {data ? `共 ${data.total} 件商品` : "加载中…"}
        </span>
      </div>

      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <EmptyState>没有找到匹配的商品</EmptyState>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">商品</th>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">类型 / 设计</th>
                  <th className="px-5 py-3 font-medium">价格</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ikea-gray-200">
                {data.items.map((product) => (
                  <tr key={product.id} className="hover:bg-ikea-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded bg-ikea-gray-100" />
                        )}
                        <div>
                          <div className="font-medium text-ikea-black">{product.name}</div>
                          <div className="mt-0.5 max-w-xs truncate text-xs text-ikea-muted">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-ikea-muted">{product.id}</td>
                    <td className="px-5 py-3 text-xs text-ikea-muted">
                      {product.productType ?? "—"}
                      {product.designText ? ` / ${product.designText}` : ""}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {product.price === null || product.price === undefined
                        ? "—"
                        : formatPrice(product.price)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-xs font-medium text-ikea-blue hover:underline"
                      >
                        编辑
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
