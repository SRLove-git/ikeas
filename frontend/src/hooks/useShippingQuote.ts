"use client"

import { useEffect, useState } from "react"
import { apiJson, type ShippingQuote } from "@/lib/api"

export function useShippingQuote() {
  const [quote, setQuote] = useState<ShippingQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await apiJson<ShippingQuote>("/shipping/quote")
        if (!cancelled) {
          setQuote(data)
          setError(false)
        }
      } catch {
        if (!cancelled) {
          setQuote(null)
          setError(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { quote, loading, error }
}
