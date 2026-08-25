"use client"

import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()
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
    show("success", t("admin.favorites.cleared"))
    await load()
  }

  return (
    <div>
      <PageHeader
        title={t("admin.favorites.title")}
        description={t("admin.favorites.desc")}
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!favorites ? (
          <Loading label={t("admin.users.loading")} />
        ) : favorites.length === 0 ? (
          <EmptyState>{t("admin.favorites.empty")}</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t("admin.favorites.colUser")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.favorites.colProducts")}</th>
                <th className="px-5 py-3 text-right font-medium">
                  {t("admin.common.colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {favorites.map((favorite) => (
                <tr key={favorite.userId} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ikea-black">
                      {favorite.user?.name ?? t("admin.orders.unknownUser")}
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
                    <ConfirmButton onConfirm={() => clear(favorite.userId)}>
                      {t("admin.favorites.clearFavorites")}
                    </ConfirmButton>
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
