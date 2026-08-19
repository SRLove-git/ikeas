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
  SearchBox,
  Select,
} from "@/components/admin/admin-ui"

interface PageItem {
  url: string
  family: string
  title: string
  name: string | null
  source?: "crawled" | "legacy"
}

interface Families {
  name: string
  count: number
}

const FAMILY_LABEL: Record<string, string> = {
  "customer-service": "客户服务",
  company: "公司介绍",
  legal: "法律与条款",
  root: "首页",
}

function keyFor(url: string): string {
  return btoa(unescape(encodeURIComponent(url)))
}

export default function PagesPage() {
  const [family, setFamily] = useState("")
  const [query, setQuery] = useState("")
  const [families, setFamilies] = useState<Families[]>([])
  const [items, setItems] = useState<PageItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ items: PageItem[]; families: Families[] }>(
          `/api/admin/pages?family=${encodeURIComponent(family)}&q=${encodeURIComponent(query)}`,
        )
        setItems(data.items)
        setFamilies(data.families)
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [family, query])

  return (
    <div>
      <PageHeader
        title="页面内容"
        description="管理全部内容页面（房间、灵感、活动、客服、门店、新闻等），可编辑区块化内容。"
        actions={
          <Link href="/admin/pages/new">
            <Button>新建页面</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={family} onChange={(e) => setFamily(e.target.value)} className="w-52">
          <option value="">全部栏目</option>
          {families.map((f) => (
            <option key={f.name} value={f.name}>
              {FAMILY_LABEL[f.name] ?? f.name}（{f.count}）
            </option>
          ))}
        </Select>
        <SearchBox value={query} onChange={setQuery} placeholder="搜索标题 / URL…" />
        <span className="text-xs text-ikea-muted">{items ? `共 ${items.length} 个页面` : ""}</span>
      </div>

      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!items ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState>没有找到页面</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">标题</th>
                <th className="px-5 py-3 font-medium">栏目</th>
                <th className="px-5 py-3 font-medium">URL</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {items.map((page) => (
                <tr key={page.url} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ikea-black">{page.title}</div>
                    {page.name ? (
                      <div className="mt-0.5 text-xs text-ikea-muted">{page.name}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-ikea-gray-100 px-2 py-0.5 text-xs text-ikea-muted">
                      {FAMILY_LABEL[page.family] ?? page.family}
                    </span>
                    {page.source === "legacy" ? (
                      <span className="ml-1.5 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        兜底
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-[280px] truncate px-5 py-3 font-mono text-xs text-ikea-muted">
                    {page.url}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/pages/${keyFor(page.url)}`}
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
  )
}
