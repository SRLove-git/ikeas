"use client"

import { useEffect } from "react"

const BROWSING_HISTORY_KEY = "buzud_browsing_history"

export function BrowsingHistoryTracker({ productId }: { productId: string }) {
  useEffect(() => {
    if (!productId) return

    const current = JSON.parse(
      window.localStorage.getItem(BROWSING_HISTORY_KEY) ?? "[]",
    ) as string[]
    const next = [productId, ...current.filter((id) => id !== productId)].slice(0, 24)
    window.localStorage.setItem(BROWSING_HISTORY_KEY, JSON.stringify(next))
  }, [productId])

  return null
}
