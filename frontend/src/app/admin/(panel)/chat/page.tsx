"use client"

import { useCallback, useEffect, useState } from "react"
import {
  adminFetch,
  Button,
  ConfirmButton,
  EmptyState,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  useNotice,
} from "@/components/admin/admin-ui"

interface ChatMessage {
  id?: string
  at?: string
  user?: string | null
  message: string
  reply?: string
}

export default function ChatPage() {
  const { notice, show } = useNotice()
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ items: ChatMessage[] }>("/api/admin/server/chat/messages")
      setMessages(data.items)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const clear = async () => {
    await adminFetch("/api/admin/server/chat/messages", { method: "DELETE" })
    show("success", "聊天记录已清空")
    await load()
  }

  return (
    <div>
      <PageHeader
        title="客服聊天"
        description="查看客服机器人的问答记录（Spring Boot 内存存储）。"
        actions={
          <Button variant="secondary" onClick={() => void load()}>
            刷新
          </Button>
        }
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!messages ? (
          <Loading label="连接运营服务…" />
        ) : messages.length === 0 ? (
          <EmptyState>暂无聊天记录</EmptyState>
        ) : (
          <>
            <div className="divide-y divide-ikea-gray-200">
              {messages.map((message, index) => (
                <div key={message.id ?? index} className="p-5">
                  <div className="mb-1 flex items-center gap-2 text-xs text-ikea-muted">
                    <span className="font-medium text-ikea-black">{message.user ?? "访客"}</span>
                    {message.at ? (
                      <span>{new Date(message.at).toLocaleString("zh-CN")}</span>
                    ) : null}
                  </div>
                  <div className="rounded-md bg-ikea-gray-50 px-3 py-2 text-sm">
                    {message.message}
                  </div>
                  {message.reply ? (
                    <div className="mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-ikea-blue">
                      <span className="mr-1 font-medium">BUZUD 客服：</span>
                      {message.reply}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="border-t border-ikea-gray-200 px-5 py-3 text-right">
              <ConfirmButton onConfirm={clear}>清空全部记录</ConfirmButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
