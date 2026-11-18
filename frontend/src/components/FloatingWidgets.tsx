"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { ChatIcon, CloseIcon } from "@/components/icons"
import { ArrowUp } from "lucide-react"
import { apiJson, ApiError } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"
import { productHref } from "@/lib/product-url"
import {
  CHAT_OPEN_STORAGE_KEY,
  CHAT_STORAGE_KEY,
  CONVERSATION_STORAGE_KEY,
  SUPPORT_CHAT_RESET_EVENT,
} from "@/lib/support-chat-session"

interface ProductLink {
  id: string
  name: string
  slug: string
  price: number | null
  image: string | null
  url?: string
}

interface ChatMessage {
  role: "user" | "bot"
  text: string
  requiresHuman?: boolean
  sources?: string[]
  products?: ProductLink[]
}

const supportLinks = {
  "/zh/all-products/": "floating.productsLink",
  "/zh/coupon/": "floating.couponLink",
  "/zh/profile/coupons/": "floating.myCouponsLink",
  "/zh/customer-service/warranty-registration/": "floating.warrantyLink",
}

const PRODUCT_LINK = /(\/zh\/p\/[^\s，。；、）)\]】.]+)/g
const MAX_STORED_MESSAGES = 50
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readStoredProducts(value: unknown): ProductLink[] | undefined {
  if (!Array.isArray(value)) return undefined
  const products: ProductLink[] = []
  for (const item of value) {
    if (!item || typeof item !== "object") continue
    const candidate = item as Partial<ProductLink>
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.name !== "string" ||
      typeof candidate.slug !== "string" ||
      !candidate.slug ||
      candidate.slug.includes("/")
    ) {
      continue
    }
    products.push({
      id: candidate.id,
      name: candidate.name,
      slug: candidate.slug,
      price: typeof candidate.price === "number" ? candidate.price : null,
      image:
        typeof candidate.image === "string" && /^(https?:\/\/|\/)/.test(candidate.image)
          ? candidate.image
          : null,
    })
  }
  return products.length > 0 ? products : undefined
}

function readStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.sessionStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const messages: ChatMessage[] = []
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue
      const candidate = item as Partial<ChatMessage>
      if (
        (candidate.role === "user" || candidate.role === "bot") &&
        typeof candidate.text === "string"
      ) {
        messages.push({
          role: candidate.role,
          text: candidate.text,
          requiresHuman: candidate.requiresHuman === true,
          sources: Array.isArray(candidate.sources)
            ? candidate.sources.filter((source): source is string => typeof source === "string")
            : undefined,
          products: readStoredProducts(candidate.products),
        })
      }
    }
    return messages.slice(-MAX_STORED_MESSAGES)
  } catch {
    return []
  }
}

function storeMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
    )
  } catch {
    // Session storage can be unavailable in private browsing; keep the in-memory chat.
  }
}

function readStoredConversation(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage.getItem(CONVERSATION_STORAGE_KEY)
  } catch {
    return null
  }
}

function storeConversation(conversationId: string) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId)
  } catch {
    // Ignore storage failures; the current tab still keeps the ref value.
  }
}

/** Renders product-page paths returned with answer evidence as real links. */
function ChatText({ text }: { text: string }) {
  return (
    <>
      {text.split(PRODUCT_LINK).map((part, index) =>
        part.startsWith("/zh/p/") ? (
          <Link key={index} href={part} className="mt-1 block underline">
            {part}
          </Link>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

export function FloatingWidgets() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const productSlug = (() => {
    const match = pathname?.match(/\/p\/([^/?#]+)/)
    if (!match) return undefined
    try {
      return decodeURIComponent(match[1])
    } catch {
      return match[1]
    }
  })()
  const [showCookieBar, setShowCookieBar] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [showBackTop, setShowBackTop] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "bot", text: t("floating.chatGreeting") },
  ])
  const [chatInput, setChatInput] = useState("")
  const [sendingChat, setSendingChat] = useState(false)
  const [orderNo, setOrderNo] = useState("")
  const [colliding, setColliding] = useState(false)
  const conversationId = useRef<string | null>(null)
  const conversation = useRef<HTMLDivElement | null>(null)
  const chatRequest = useRef<AbortController | null>(null)
  const chatGeneration = useRef(0)

  const appendMessage = (message: ChatMessage) => {
    setChatMessages((current) => {
      const next = [...current, message]
      storeMessages(next)
      return next
    })
  }

  useEffect(() => {
    // The storefront renders SiteLayout per page, so the widget remounts on navigation.
    // Restore the current tab's chat instead of showing a fresh greeting every time.
    const stored = readStoredMessages()
    if (stored.length > 0) setChatMessages(stored)
    const storedConversation = readStoredConversation()
    if (storedConversation && UUID_PATTERN.test(storedConversation)) {
      conversationId.current = storedConversation
    }
    try {
      if (window.sessionStorage.getItem(CHAT_OPEN_STORAGE_KEY) === "1") setShowChat(true)
    } catch {
      // Session storage may be unavailable; keep the widget closed.
    }
  }, [])

  useEffect(() => {
    const resetForIdentityChange = () => {
      chatGeneration.current += 1
      chatRequest.current?.abort()
      chatRequest.current = null
      conversationId.current = null
      setChatMessages([{ role: "bot", text: t("floating.chatGreeting") }])
      setChatInput("")
      setOrderNo("")
      setSendingChat(false)
      setShowChat(false)
    }
    window.addEventListener(SUPPORT_CHAT_RESET_EVENT, resetForIdentityChange)
    return () => {
      window.removeEventListener(SUPPORT_CHAT_RESET_EVENT, resetForIdentityChange)
      chatGeneration.current += 1
      chatRequest.current?.abort()
    }
  }, [t])

  useEffect(() => {
    if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight
  }, [chatMessages, showChat])

  useEffect(() => {
    // Cookie 条显示时把页面内容顶上去，避免盖住底部购买按钮
    if (showCookieBar) {
      document.body.style.paddingBottom = "56px"
    } else {
      document.body.style.paddingBottom = ""
    }
    return () => {
      document.body.style.paddingBottom = ""
    }
  }, [showCookieBar])

  useEffect(() => {
    // 遇到带 data-avoid-floating 的交互区域（如加入购物袋）时自动上移悬浮客服按钮
    const targets = Array.from(document.querySelectorAll("[data-avoid-floating]"))
    if (targets.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        setColliding(entries.some((entry) => entry.isIntersecting))
      },
      { rootMargin: "-72px 0px -72px 0px" },
    )
    targets.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  const setChatOpen = (open: boolean) => {
    setShowChat(open)
    try {
      window.sessionStorage.setItem(CHAT_OPEN_STORAGE_KEY, open ? "1" : "0")
    } catch {
      // Ignore storage failures; the panel still opens or closes for this render.
    }
  }

  const sendChat = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text || sendingChat) return
    appendMessage({ role: "user", text })
    setChatInput("")
    setSendingChat(true)
    const generation = chatGeneration.current
    const requestController = new AbortController()
    chatRequest.current?.abort()
    chatRequest.current = requestController
    const timeout = window.setTimeout(() => requestController.abort(), 35000)
    conversationId.current ??= crypto.randomUUID()
    storeConversation(conversationId.current)
    try {
      const data = await apiJson<{
        reply: string
        requiresHuman: boolean
        citations: Array<{ title: string }>
        products?: ProductLink[]
      }>("/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          orderNo: orderNo.trim() || undefined,
          conversationId: conversationId.current,
          productSlug,
        }),
        signal: requestController.signal,
      })
      if (generation === chatGeneration.current) {
        appendMessage({
          role: "bot",
          text: data.reply ?? t("floating.chatFallback"),
          requiresHuman: data.requiresHuman,
          sources: data.citations?.map((item) => item.title),
          products: data.products,
        })
      }
    } catch (error) {
      if (generation === chatGeneration.current) {
        appendMessage({
          role: "bot",
          text: error instanceof ApiError ? error.message : t("floating.chatNetworkError"),
        })
      }
    } finally {
      window.clearTimeout(timeout)
      if (chatRequest.current === requestController) chatRequest.current = null
      if (generation === chatGeneration.current) setSendingChat(false)
    }
  }

  return (
    <>
      {showCookieBar ? (
        <div className="cloud fixed inset-x-0 bottom-0 z-50 border-t border-ikea-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-10 sm:py-4">
            <p className="line-clamp-1 text-xs text-ikea-black sm:text-sm">
              {t("floating.cookieBar")}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                className="hidden text-xs underline underline-offset-2 sm:inline"
              >
                {t("floating.cookieSettings")}
              </button>
              <button
                type="button"
                className="i-btn i-btn--small i-btn--primary whitespace-nowrap"
                onClick={() => setShowCookieBar(false)}
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label text-xs sm:text-sm">
                    {t("floating.cookieAccept")}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={t("floating.customerServiceAria")}
        data-support-launcher
        className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ikea-blue text-white shadow-lg transition-[bottom,transform] hover:scale-105 ${
          colliding || showCookieBar ? "bottom-28" : "bottom-6"
        }`}
        onClick={() => setChatOpen(!showChat)}
      >
        <ChatIcon width={28} height={28} />
      </button>

      {showChat ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-lg border border-ikea-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-ikea-black px-4 py-3 text-white">
            <span className="text-sm font-bold">{t("floating.customerServiceTitle")}</span>
            <button type="button" aria-label={t("common.close")} onClick={() => setChatOpen(false)}>
              <CloseIcon width={18} height={18} />
            </button>
          </div>
          <div ref={conversation} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {chatMessages.map((chat, index) => (
              <div
                key={index}
                data-support-message={chat.role}
                className={
                  chat.role === "user"
                    ? "max-w-[220px] self-end rounded-lg rounded-tr-none bg-ikea-blue p-3 text-sm text-white"
                    : "max-w-[220px] rounded-lg rounded-tl-none bg-ikea-gray-100 p-3 text-sm text-ikea-black"
                }
              >
                {chat.role === "bot" ? <ChatText text={chat.text} /> : chat.text}
                {chat.sources?.length ? (
                  <p className="mt-2 text-xs text-ikea-gray-600">{chat.sources.join(" · ")}</p>
                ) : null}
                {chat.requiresHuman ? (
                  <Link href="/zh/profile/support-tickets/" className="mt-2 block underline">
                    {t("floating.humanSupport", "联系人工客服")}
                  </Link>
                ) : null}
                {chat.role === "bot" &&
                  Object.entries(supportLinks)
                    .filter(([href]) => chat.text.includes(href))
                    .map(([href, label]) => (
                      <Link key={href} href={href} className="mt-2 block underline">
                        {t(label)}
                      </Link>
                    ))}
                {chat.role === "bot" && chat.products?.length ? (
                  <div className="mt-2 space-y-1.5">
                    {chat.products.map((product) => (
                      <Link
                        key={product.id}
                        href={productHref({ ...product, slug: encodeURIComponent(product.slug) })}
                        data-support-product-link
                        className="flex items-center gap-2 rounded-md border border-ikea-gray-200 bg-white p-1.5 hover:border-ikea-blue"
                      >
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt=""
                            loading="lazy"
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{product.name}</span>
                          <span className="block text-xs text-ikea-gray-600">
                            {formatPrice(product.price)}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-bold text-ikea-blue">
                          {t("floating.buyNow")}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="border-t border-ikea-gray-200 p-3">
            <input
              value={orderNo}
              onChange={(event) => setOrderNo(event.target.value)}
              maxLength={80}
              aria-label={t("floating.orderContext", "关联订单号（选填，查询需登录）")}
              placeholder={t("floating.orderContext", "关联订单号（选填，查询需登录）")}
              className="mb-2 w-full rounded-lg border border-ikea-gray-200 px-3 py-2 text-sm"
            />
            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatInput}
                maxLength={2000}
                onChange={(event) => setChatInput(event.target.value)}
                className="w-full rounded-full border border-ikea-gray-200 px-4 py-2 text-sm outline-none focus:border-ikea-blue"
                placeholder={t("floating.chatPlaceholder")}
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="i-btn i-btn--small i-btn--primary shrink-0 rounded-full disabled:opacity-50"
              >
                <span className="i-btn__label">{t("floating.send")}</span>
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {showBackTop ? (
        <button
          type="button"
          aria-label={t("common.backToTop")}
          onClick={backToTop}
          className="i-back-top fixed bottom-6 right-24 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-ikea-black text-white shadow-md transition-opacity hover:opacity-80"
        >
          <ArrowUp width={20} height={20} />
        </button>
      ) : null}
    </>
  )
}
