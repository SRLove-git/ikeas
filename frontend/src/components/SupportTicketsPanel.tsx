"use client"

import { useEffect, useState } from "react"
import { apiJson } from "@/lib/api"

interface TicketView {
  id: number
  ticketNo: string
  userId: number
  orderNo: string | null
  afterSaleNo: string | null
  subject: string
  message: string
  status: number
  assignee: string | null
  reply: string | null
  repliedAt: string | null
  createdAt: string
}

export function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<TicketView[]>([])
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [orderNo, setOrderNo] = useState("")
  const [afterSaleNo, setAfterSaleNo] = useState("")
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      setTickets(await apiJson<TicketView[]>("/support-tickets"))
    } catch {
      setTickets([])
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const submit = async () => {
    setSubmitting(true)
    setNotice(null)
    try {
      await apiJson("/support-tickets", {
        method: "POST",
        body: JSON.stringify({
          orderNo: orderNo || null,
          afterSaleNo: afterSaleNo || null,
          subject,
          message,
        }),
      })
      setSubject("")
      setMessage("")
      setOrderNo("")
      setAfterSaleNo("")
      await load()
    } catch (ex) {
      setNotice(ex instanceof Error ? ex.message : "提交工单失败")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <h1 className="text-2xl font-bold">客服工单</h1>

        <section className="mt-6 rounded border border-ikea-gray-200 bg-ikea-gray-50 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="主题"
              className="h-10 border border-ikea-gray-200 bg-white px-3 text-sm outline-none"
            />
            <input
              value={orderNo}
              onChange={(event) => setOrderNo(event.target.value)}
              placeholder="关联订单号（可选）"
              className="h-10 border border-ikea-gray-200 bg-white px-3 text-sm outline-none"
            />
            <input
              value={afterSaleNo}
              onChange={(event) => setAfterSaleNo(event.target.value)}
              placeholder="关联售后单号（可选）"
              className="h-10 border border-ikea-gray-200 bg-white px-3 text-sm outline-none sm:col-span-2"
            />
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="请描述您遇到的问题"
            className="mt-3 min-h-32 w-full border border-ikea-gray-200 bg-white px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            disabled={submitting || !subject.trim() || !message.trim()}
            onClick={() => void submit()}
            className="mt-3 rounded bg-ikea-blue px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            提交工单
          </button>
          {notice ? <p className="mt-2 text-sm text-ikea-blue">{notice}</p> : null}
        </section>

        <div className="mt-6 space-y-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded border border-ikea-gray-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">{ticket.subject}</h2>
                <span className="text-xs text-ikea-muted">{ticket.ticketNo}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-ikea-muted">{ticket.message}</p>
              {ticket.reply ? (
                <p className="mt-3 rounded bg-ikea-gray-50 p-3 text-sm leading-6">
                  客服回复：{ticket.reply}
                </p>
              ) : (
                <p className="mt-3 text-xs text-ikea-muted">处理中</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
