"use client"

import { useEffect, useState } from "react"
import { ChatIcon, CloseIcon } from "@/components/icons"
import { ArrowUp } from "lucide-react"
import { API_BASE } from "@/lib/api"

interface ChatMessage {
  role: "user" | "bot"
  text: string
}

export function FloatingWidgets() {
  const [showCookieBar, setShowCookieBar] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "你好！我是 BUZUD 客服助手，请问有什么可以帮你的？" },
  ])
  const [chatInput, setChatInput] = useState("")
  const [sendingChat, setSendingChat] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  const sendChat = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text || sendingChat) return
    setChatMessages((current) => [...current, { role: "user", text }])
    setChatInput("")
    setSendingChat(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      setChatMessages((current) => [
        ...current,
        { role: "bot", text: data.reply ?? "抱歉，我暂时无法回答这个问题。" },
      ])
    } catch {
      setChatMessages((current) => [...current, { role: "bot", text: "网络异常，请稍后再试。" }])
    } finally {
      setSendingChat(false)
    }
  }

  return (
    <>
      {showCookieBar ? (
        <div className="cloud fixed inset-x-0 bottom-0 z-50 border-t border-ikea-gray-200 bg-white shadow-lg">
          <div className="flex flex-col items-start justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-10">
            <p className="text-sm text-ikea-black">
              BUZUD 官网使用 Cookies 提升浏览体验。继续浏览即表示您接受我们的 Cookies 政策。
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button type="button" className="text-sm underline underline-offset-2">
                设置
              </button>
              <button
                type="button"
                className="i-btn i-btn--small i-btn--primary"
                onClick={() => setShowCookieBar(false)}
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label">我接受</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="客服"
        className="chat-menu fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ikea-blue text-white shadow-lg transition-transform hover:scale-105"
        onClick={() => setShowChat((current) => !current)}
      >
        <ChatIcon width={28} height={28} />
      </button>

      {showChat ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-lg border border-ikea-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-ikea-black px-4 py-3 text-white">
            <span className="text-sm font-bold">BUZUD 客服</span>
            <button type="button" aria-label="关闭" onClick={() => setShowChat(false)}>
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {chatMessages.map((chat, index) => (
              <div
                key={index}
                className={
                  chat.role === "user"
                    ? "max-w-[220px] self-end rounded-lg rounded-tr-none bg-ikea-blue p-3 text-sm text-white"
                    : "max-w-[220px] rounded-lg rounded-tl-none bg-ikea-gray-100 p-3 text-sm text-ikea-black"
                }
              >
                {chat.text}
              </div>
            ))}
          </div>
          <div className="border-t border-ikea-gray-200 p-3">
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                className="w-full rounded-full border border-ikea-gray-200 px-4 py-2 text-sm outline-none focus:border-ikea-blue"
                placeholder="请输入您的问题"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="i-btn i-btn--small i-btn--primary shrink-0 rounded-full disabled:opacity-50"
              >
                <span className="i-btn__label">发送</span>
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {showBackTop ? (
        <button
          type="button"
          aria-label="回到顶部"
          onClick={backToTop}
          className="i-back-top fixed bottom-6 right-24 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-ikea-black text-white shadow-md transition-opacity hover:opacity-80"
        >
          <ArrowUp width={20} height={20} />
        </button>
      ) : null}
    </>
  )
}
