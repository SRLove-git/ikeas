"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
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

function keyFor(url: string): string {
  return btoa(unescape(encodeURIComponent(url)))
}

export default function PagesPage() {
  const { t } = useTranslation()
  const FAMILY_LABEL: Record<string, string> = {
    "customer-service": t("admin.pages.familyCustomerService"),
    company: t("admin.pages.familyCompany"),
    legal: t("admin.pages.familyLegal"),
    root: t("admin.pages.familyRoot"),
  }
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
        title={t("admin.pages.title")}
        description={t("admin.pages.desc")}
        actions={
          <Link href="/admin/pages/new">
            <Button>{t("admin.pages.new")}</Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={family} onChange={(e) => setFamily(e.target.value)} className="w-52">
          <option value="">{t("admin.pages.allFamilies")}</option>
          {families.map((f) => (
            <option key={f.name} value={f.name}>
              {FAMILY_LABEL[f.name] ?? f.name}（{f.count}）
            </option>
          ))}
        </Select>
        <SearchBox value={query} onChange={setQuery} placeholder={t("admin.pages.searchPlaceholder")} />
        <span className="text-xs text-ikea-muted">
          {items ? t("admin.pages.count", { count: items.length }) : ""}
        </span>
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
          <EmptyState>{t("admin.pages.empty")}</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t("admin.pages.colTitle")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.pages.colFamily")}</th>
                <th className="px-5 py-3 font-medium">URL</th>
                <th className="px-5 py-3 text-right font-medium">
                  {t("admin.common.colActions")}
                </th>
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
                        {t("admin.pages.fallbackBadge")}
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
                      {t("admin.products.edit")}
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
