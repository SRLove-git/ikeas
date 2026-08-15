"use client"

import { useCallback, useEffect, useState } from "react"
import {
  adminFetch,
  ConfirmButton,
  EmptyState,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  useNotice,
} from "@/components/admin/admin-ui"

interface Favorite {
  userId: string
  user: { name: string; phone?: string | null } | null
  productIds: string[]
}

export default function FavoritesPage() {
  const { notice, show } = useNotice()
  const [favorites, setFavorites] = useState<Favorite[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ items: Favorite[] }>("/api/admin/server/favorites")
      setFavorites(data.items)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const clear = async (userId: string) => {
    await adminFetch(`/api/admin/server/favorites/${userId}`, { method: "DELETE" })
    show("success", "收藏已清空")
    await load()
  }

  return (
    <div>
      <PageHeader
        title="收藏管理"
        description="查看/清空用户收藏的商品（Spring Boot + PostgreSQL 持久化）。"
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!favorites ? (
          <Loading label="连接运营服务…" />
        ) : favorites.length === 0 ? (
          <EmptyState>暂无收藏数据</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">收藏商品</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {favorites.map((favorite) => (
                <tr key={favorite.userId} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ikea-black">
                      {favorite.user?.name ?? "未知用户"}
                    </div>
                    <div className="text-xs text-ikea-muted">{favorite.userId}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {favorite.productIds.map((id) => (
                      <span
                        key={id}
                        className="mr-2 inline-block rounded bg-ikea-gray-100 px-1.5 py-0.5"
                      >
                        {id}
                      </span>
                    ))}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ConfirmButton onConfirm={() => clear(favorite.userId)}>清空收藏</ConfirmButton>
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
