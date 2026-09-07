"use client"

import { useCallback, useEffect, useState } from "react"
import { apiJson, getToken } from "@/lib/api"

interface ReviewView {
  id: number
  productId: string
  userId: number
  userName: string
  rating: number
  content: string
  images: string[]
  createdAt: string
}

interface ProductReviews {
  productId: string
  averageRating: number
  count: number
  items: ReviewView[]
}

export function ProductReviews({ productId }: { productId: string }) {
  const [data, setData] = useState<ProductReviews | null>(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiJson<ProductReviews>(`/reviews/${productId}`)
      setData(result)
    } catch {
      setData({ productId, averageRating: 0, count: 0, items: [] })
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

  const submit = async () => {
    if (!getToken()) {
      window.location.href = "/zh/profile/login/"
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await apiJson("/reviews", {
        method: "POST",
        body: JSON.stringify({ productId, rating, content, images: [] }),
      })
      setContent("")
      setRating(5)
      await load()
    } catch (ex) {
      setMessage(ex instanceof Error ? ex.message : "提交评价失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-14 border-t border-ikea-gray-200 pt-10">
      <h2 className="text-xl font-bold">
        商品评价 {data ? `(${data.count})` : ""}
        {data && data.count > 0 ? ` · ${data.averageRating} 分` : ""}
      </h2>

      <div className="mt-5 rounded border border-ikea-gray-200 bg-ikea-gray-50 p-5">
        <label className="text-sm font-bold">评分</label>
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="mt-2 h-10 w-full border border-ikea-gray-200 bg-white px-3 text-sm outline-none"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} 星
            </option>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="分享你的使用体验"
          className="mt-3 min-h-24 w-full border border-ikea-gray-200 bg-white px-3 py-2 text-sm outline-none"
        />
        <button
          type="button"
          disabled={submitting || !content.trim()}
          onClick={() => void submit()}
          className="mt-3 rounded bg-ikea-blue px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          提交评价
        </button>
        {message ? <p className="mt-2 text-sm text-ikea-blue">{message}</p> : null}
      </div>

      <div className="mt-5 space-y-4">
        {data?.items.map((review) => (
          <article key={review.id} className="rounded border border-ikea-gray-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">{review.userName}</span>
              <span className="text-sm font-bold text-ikea-blue">{review.rating} 星</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ikea-muted">{review.content}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
