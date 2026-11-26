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
  role: "user" | "bot" | "human"
  text: string
  requiresHuman?: boolean
  humanSequence?: number
  sources?: string[]
  products?: ProductLink[]
  decisionTrace?: DecisionTrace
}

interface ChatCitation {
  title: string
  reference?: string
}

type DecisionIntent = "product" | "order" | "aftersales" | "service" | "general"

interface DecisionTrace {
  intent: DecisionIntent
  sourceTitles: string[]
  productCount: number
  medicalBoundary: boolean
  stockBoundary: boolean
  requiresHuman: boolean
}

const supportLinks = {
  "/zh/all-products/": "floating.productsLink",
  "/zh/coupon/": "floating.couponLink",
  "/zh/profile/coupons/": "floating.myCouponsLink",
  "/zh/customer-service/warranty-registration/": "floating.warrantyLink",
}

const PRODUCT_LINK = /(\/zh\/p\/[^\s，。；、）)\]】.]+)/g
const PRODUCT_MARKDOWN_LINK = /\[[^\]\n]{1,120}\]\(\s*\/zh\/p\/[^\s)]+\s*\)/gi
const PRODUCT_CARD_PATH = /[ \t]*[，,]?[ \t]*\/zh\/p\/[^\s，。；、）)\]】.]+/gi
const MAX_STORED_MESSAGES = 50
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const HEALTH_QUERY = /血糖|血压|心率|健康|症状|医生|医嘱|诊断|glucose|medical|doctor|health/i
const STOCK_QUERY = /库存|现货|可售|stock|available|availability/i

function classifyDecisionIntent(question: string): DecisionIntent {
  if (/订单|物流|发货|配送|order|tracking|shipment|delivery/i.test(question)) return "order"
  if (/退款|退货|换货|售后|保修|维修|refund|return|warranty|repair/i.test(question)) {
    return "aftersales"
  }
  if (/商品|产品|价格|规格|推荐|监测|购买|price|product|recommend|monitor/i.test(question)) {
    return "product"
  }
  if (/门店|预约|服务|store|booking|service/i.test(question)) return "service"
  return "general"
}

function buildDecisionTrace(
  question: string,
  citations: ChatCitation[] | undefined,
  products: ProductLink[] | undefined,
  requiresHuman: boolean,
): DecisionTrace {
  return {
    intent: classifyDecisionIntent(question),
    sourceTitles: [
      ...new Set(
        (citations ?? [])
          .map((citation) => citation.title.trim())
          .filter((title) => Boolean(title)),
      ),
    ],
    productCount: products?.length ?? 0,
    medicalBoundary: HEALTH_QUERY.test(question),
    stockBoundary: STOCK_QUERY.test(question) || Boolean(products?.length),
    requiresHuman,
  }
}

function readStoredDecisionTrace(value: unknown): DecisionTrace | undefined {
  if (!value || typeof value !== "object") return undefined
  const trace = value as Partial<DecisionTrace>
  if (
    !trace.intent ||
    !["product", "order", "aftersales", "service", "general"].includes(trace.intent) ||
    !Array.isArray(trace.sourceTitles) ||
    typeof trace.productCount !== "number"
  ) {
    return undefined
  }
  return {
    intent: trace.intent,
    sourceTitles: trace.sourceTitles.filter(
      (title): title is string => typeof title === "string" && Boolean(title),
    ),
    productCount: Math.max(0, Math.floor(trace.productCount)),
    medicalBoundary: trace.medicalBoundary === true,
    stockBoundary: trace.stockBoundary === true,
    requiresHuman: trace.requiresHuman === true,
  }
}

function visibleSourceTitles(citations: ChatCitation[] | undefined, hasProductCards: boolean) {
  const titles = new Set<string>()
  for (const citation of citations ?? []) {
    if (hasProductCards && citation.reference?.startsWith("catalog://")) continue
    const title = citation.title.trim()
    if (title) titles.add(title)
  }
  return titles.size > 0 ? [...titles] : undefined
}

function replyForProductCards(text: string, hasProductCards: boolean) {
  if (!hasProductCards || !text.includes("/zh/p/")) return text
  return text
    .replace(PRODUCT_MARKDOWN_LINK, "")
    .replace(PRODUCT_CARD_PATH, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function productCardImage(image: string | null) {
  if (!image) return null
  try {
    const url = new URL(image, "https://local.invalid")
    if (
      url.hostname === "medical-sg.oss-ap-southeast-1.aliyuncs.com" &&
      url.pathname.startsWith("/images/products/")
    ) {
      return url.pathname
    }
  } catch {
    return image
  }
  return image
}

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
        (candidate.role === "user" || candidate.role === "bot" || candidate.role === "human") &&
        typeof candidate.text === "string"
      ) {
        const products = readStoredProducts(candidate.products)
        messages.push({
          role: candidate.role,
          text: replyForProductCards(candidate.text, Boolean(products?.length)),
          requiresHuman: candidate.requiresHuman === true,
          humanSequence:
            typeof candidate.humanSequence === "number" && candidate.humanSequence > 0
              ? Math.floor(candidate.humanSequence)
              : undefined,
          sources: Array.isArray(candidate.sources)
            ? [
                ...new Set(
                  candidate.sources.filter(
                    (source): source is string => typeof source === "string" && Boolean(source),
                  ),
                ),
              ]
            : undefined,
          products,
          decisionTrace: readStoredDecisionTrace(candidate.decisionTrace),
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
  const [processingStep, setProcessingStep] = useState(0)
  const [pendingQuestion, setPendingQuestion] = useState("")
  const [orderNo, setOrderNo] = useState("")
  const [colliding, setColliding] = useState(false)
  const [handoffStatus, setHandoffStatus] = useState<"none" | "pending" | "claimed" | "resolved">(
    "none",
  )
  const [assignedAgent, setAssignedAgent] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const conversationId = useRef<string | null>(null)
  const lastHumanSequence = useRef(0)
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
    if (stored.length > 0) {
      setChatMessages(stored)
      lastHumanSequence.current = Math.max(
        0,
        ...stored.map((message) => message.humanSequence ?? 0),
      )
    }
    const storedConversation = readStoredConversation()
    if (storedConversation && UUID_PATTERN.test(storedConversation)) {
      conversationId.current = storedConversation
      setActiveConversationId(storedConversation)
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
      setActiveConversationId(null)
      lastHumanSequence.current = 0
      setHandoffStatus("none")
      setAssignedAgent(null)
      setChatMessages([{ role: "bot", text: t("floating.chatGreeting") }])
      setChatInput("")
      setOrderNo("")
      setSendingChat(false)
      setPendingQuestion("")
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
    if (!showChat || !activeConversationId) return
    let active = true
    const poll = async () => {
      const currentConversation = activeConversationId
      try {
        const data = await apiJson<{
          status: "none" | "pending" | "claimed" | "resolved"
          assigned_to: string | null
          replies: Array<{ sequence: number; text: string; time: string; agent_name: string }>
        }>(
          `/chat/handoff/${encodeURIComponent(currentConversation)}?afterSequence=${lastHumanSequence.current}`,
        )
        if (!active) return
        setHandoffStatus(data.status)
        setAssignedAgent(data.assigned_to)
        const replies = data.replies
          .filter((reply) => reply.sequence > lastHumanSequence.current)
          .sort((left, right) => left.sequence - right.sequence)
        if (replies.length > 0) {
          lastHumanSequence.current = replies[replies.length - 1].sequence
          setChatMessages((current) => {
            const existing = new Set(current.map((message) => message.humanSequence).filter(Boolean))
            const next = [
              ...current,
              ...replies
                .filter((reply) => !existing.has(reply.sequence))
                .map((reply): ChatMessage => ({
                  role: "human",
                  text: reply.text,
                  humanSequence: reply.sequence,
                })),
            ]
            storeMessages(next)
            return next
          })
        }
      } catch {
        // Keep the chat usable while the handoff status endpoint is temporarily unavailable.
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), 10_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [activeConversationId, showChat])

  useEffect(() => {
    if (conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight
  }, [chatMessages, processingStep, sendingChat, showChat])

  useEffect(() => {
    if (!sendingChat) {
      setProcessingStep(0)
      return
    }
    const timer = window.setInterval(() => {
      setProcessingStep((current) => Math.min(current + 1, 3))
    }, 700)
    return () => window.clearInterval(timer)
  }, [sendingChat])

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
    setPendingQuestion(text)
    const generation = chatGeneration.current
    const requestController = new AbortController()
    chatRequest.current?.abort()
    chatRequest.current = requestController
    const timeout = window.setTimeout(() => requestController.abort(), 35000)
    conversationId.current ??= crypto.randomUUID()
    setActiveConversationId(conversationId.current)
    storeConversation(conversationId.current)
    try {
      const data = await apiJson<{
        reply: string
        requiresHuman: boolean
        citations: ChatCitation[]
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
          text: replyForProductCards(
            data.reply ?? t("floating.chatFallback"),
            Boolean(data.products?.length),
          ),
          requiresHuman: data.requiresHuman,
          sources: visibleSourceTitles(data.citations, Boolean(data.products?.length)),
          products: data.products,
          decisionTrace: buildDecisionTrace(
            text,
            data.citations,
            data.products,
            data.requiresHuman,
          ),
        })
        if (data.requiresHuman) setHandoffStatus("pending")
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
      if (generation === chatGeneration.current) {
        setSendingChat(false)
        setPendingQuestion("")
      }
    }
  }

  const pendingSummary =
    pendingQuestion.length > 42 ? `${pendingQuestion.slice(0, 42)}…` : pendingQuestion
  const liveTraceDetails = [
    t("floating.liveIntentDetail", { question: pendingSummary }),
    t("floating.liveEvidenceDetail"),
    HEALTH_QUERY.test(pendingQuestion)
      ? t("floating.liveConstraintMedical")
      : t("floating.liveConstraintGeneral"),
    t("floating.liveWritingDetail"),
  ]

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
        <div className="fixed bottom-20 left-3 right-3 z-40 flex h-[min(420px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-lg border border-ikea-gray-200 bg-white shadow-2xl sm:bottom-24 sm:left-auto sm:right-6 sm:h-[560px] sm:w-[400px]">
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
                    : chat.role === "human"
                      ? "max-w-[240px] rounded-lg rounded-tl-none border border-ikea-blue/30 bg-blue-50 p-3 text-sm text-ikea-black"
                    : chat.products?.length || chat.decisionTrace
                      ? "w-full rounded-lg rounded-tl-none bg-ikea-gray-100 p-3 text-sm text-ikea-black"
                      : "max-w-[220px] rounded-lg rounded-tl-none bg-ikea-gray-100 p-3 text-sm text-ikea-black"
                }
              >
                {chat.role === "bot" && chat.decisionTrace ? (
                  <details
                    data-support-reasoning
                    open={index === chatMessages.length - 1}
                    className="mb-3 rounded-md border border-blue-200 bg-blue-50/80 p-2.5"
                  >
                    <summary className="cursor-pointer list-none text-xs font-bold text-ikea-blue">
                      <span className="mr-1.5 whitespace-nowrap rounded bg-ikea-blue px-1.5 py-0.5 text-[10px] text-white">
                        {t("floating.reasoningBadge")}
                      </span>
                      {t("floating.reasoningTitle")}
                    </summary>
                    <p className="mt-2 text-[10px] leading-4 text-ikea-gray-600">
                      {t("floating.reasoningNote")}
                    </p>
                    <ol className="mt-2 space-y-2 text-xs">
                      {[
                        {
                          label: t("floating.traceIntentLabel"),
                          detail: t(
                            `floating.traceIntent${chat.decisionTrace.intent[0].toUpperCase()}${chat.decisionTrace.intent.slice(1)}`,
                          ),
                        },
                        {
                          label: t("floating.traceEvidenceLabel"),
                          detail:
                            chat.decisionTrace.sourceTitles.length > 0
                              ? t("floating.traceEvidenceDetail", {
                                  sources: chat.decisionTrace.sourceTitles.join(" · "),
                                  count: chat.decisionTrace.productCount,
                                })
                              : t("floating.traceEvidenceNone"),
                        },
                        {
                          label: t("floating.traceConstraintLabel"),
                          detail: chat.decisionTrace.requiresHuman
                            ? t("floating.traceConstraintHuman")
                            : chat.decisionTrace.medicalBoundary
                              ? t("floating.traceConstraintMedical")
                              : chat.decisionTrace.stockBoundary
                                ? t("floating.traceConstraintStock")
                                : t("floating.traceConstraintGeneral"),
                        },
                        {
                          label: t("floating.traceRecommendationLabel"),
                          detail:
                            chat.decisionTrace.productCount > 1
                              ? t("floating.traceRecommendationCompare")
                              : chat.decisionTrace.productCount === 1
                                ? t("floating.traceRecommendationSingle")
                                : t("floating.traceRecommendationKnowledge"),
                        },
                        {
                          label: t("floating.traceOutputLabel"),
                          detail:
                            chat.decisionTrace.productCount > 0
                              ? t("floating.traceOutputProducts", {
                                  count: chat.decisionTrace.productCount,
                                })
                              : t("floating.traceOutputText"),
                        },
                      ].map((item, traceIndex) => (
                        <li key={item.label} className="flex gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white font-bold text-ikea-blue shadow-sm">
                            {traceIndex + 1}
                          </span>
                          <span>
                            <strong className="block text-ikea-black">{item.label}</strong>
                            <span className="leading-4 text-ikea-gray-600">{item.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}
                {chat.role === "human" ? (
                  <strong className="mb-1 block text-xs text-ikea-blue">
                    {assignedAgent || t("floating.humanAgent", "人工客服")}
                  </strong>
                ) : null}
                {chat.role === "bot" ? <ChatText text={chat.text} /> : chat.text}
                {chat.sources?.length ? (
                  <p className="mt-2 text-xs text-ikea-gray-600">{chat.sources.join(" · ")}</p>
                ) : null}
                {chat.requiresHuman && handoffStatus === "none" ? (
                  <Link href="/zh/profile/support-tickets/" className="mt-2 block underline">
                    {t("floating.humanSupport", "联系人工客服")}
                  </Link>
                ) : chat.requiresHuman ? (
                  <p className="mt-2 text-xs font-medium text-ikea-blue">
                    {t("floating.handoffSubmitted", "已提交人工请求，请保持窗口开启")}
                  </p>
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
                        className="flex items-center gap-2 rounded-md border border-ikea-gray-200 bg-white p-2 hover:border-ikea-blue"
                      >
                        {productCardImage(product.image) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={productCardImage(product.image) ?? ""}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : null}
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-xs font-bold">
                            {product.name}
                          </span>
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
            {sendingChat ? (
              <div
                data-support-progress
                aria-live="polite"
                className="w-full rounded-lg rounded-tl-none border border-ikea-gray-200 bg-white p-3 text-ikea-black shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-ikea-blue" />
                  {t("floating.processingTitle")}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="shrink-0 whitespace-nowrap rounded bg-ikea-blue px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {t("floating.reasoningBadge")}
                  </span>
                  <span className="text-[10px] text-ikea-gray-600">
                    {t("floating.reasoningNote")}
                  </span>
                </div>
                <ol className="mt-2 space-y-1.5 text-xs">
                  {[
                    t("floating.progressUnderstanding"),
                    t("floating.progressSearching"),
                    t("floating.progressChecking"),
                    t("floating.progressWriting"),
                  ].map((label, step) => (
                    <li
                      key={label}
                      className={`flex items-center gap-2 ${
                        step <= processingStep ? "text-ikea-black" : "text-ikea-gray-500"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          step < processingStep
                            ? "bg-ikea-blue text-white"
                            : step === processingStep
                              ? "border border-ikea-blue text-ikea-blue"
                              : "border border-ikea-gray-200"
                        }`}
                      >
                        {step < processingStep ? "✓" : step === processingStep ? "•" : ""}
                      </span>
                      <span>
                        <strong className="block font-medium">{label}</strong>
                        <span className="block text-[10px] leading-4 text-ikea-gray-600">
                          {liveTraceDetails[step]}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
          <div className="border-t border-ikea-gray-200 p-3">
            {handoffStatus === "pending" || handoffStatus === "claimed" ? (
              <div
                data-support-handoff-status={handoffStatus}
                className="mb-2 rounded-md bg-ikea-gray-100 px-3 py-2 text-xs text-ikea-black"
              >
                <strong className="block">
                  {handoffStatus === "claimed"
                    ? t("floating.handoffClaimed", "人工客服已接入")
                    : t("floating.handoffPending", "正在等待人工客服接入")}
                </strong>
                {handoffStatus === "claimed" && assignedAgent ? (
                  <span className="text-ikea-gray-600">{assignedAgent}</span>
                ) : null}
              </div>
            ) : null}
            <input
              value={orderNo}
              onChange={(event) => setOrderNo(event.target.value)}
              maxLength={80}
              aria-label={t("floating.orderContextAria", "关联订单号（选填，查询需登录）")}
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
