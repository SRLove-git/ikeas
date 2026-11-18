export type PaymentMethodId =
  | "paynow"
  | "wechatpay"
  | "alipay"
  | "visa"
  | "mastercard"
  | "amex"
  | "unionpay"
  | "applepay"
  | "googlepay"

export interface PaymentMethod {
  id: PaymentMethodId
  label: string
  type: "card" | "wallet"
  badgeClassName: string
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "paynow", label: "PayNow", type: "wallet", badgeClassName: "text-[#7b1fa2]" },
  {
    id: "wechatpay",
    label: "WeChat Pay",
    type: "wallet",
    badgeClassName: "text-[#07c160]",
  },
  { id: "alipay", label: "Alipay", type: "wallet", badgeClassName: "text-[#1677ff]" },
  { id: "visa", label: "VISA", type: "card", badgeClassName: "text-[#1a1f71]" },
  {
    id: "mastercard",
    label: "Mastercard",
    type: "card",
    badgeClassName: "text-[#eb001b]",
  },
  {
    id: "amex",
    label: "AMERICAN EXPRESS",
    type: "card",
    badgeClassName: "text-[#006fcf]",
  },
  {
    id: "unionpay",
    label: "UnionPay",
    type: "card",
    badgeClassName: "text-[#007b84]",
  },
  { id: "applepay", label: "Apple Pay", type: "wallet", badgeClassName: "text-black" },
  {
    id: "googlepay",
    label: "Google Pay",
    type: "wallet",
    badgeClassName: "text-[#4285f4]",
  },
]

const PAYMENT_METHOD_IDS = new Set<string>(PAYMENT_METHODS.map((method) => method.id))
const DIRECT_WALLET_METHODS: PaymentMethodId[] = ["paynow"]

export function isPaymentMethodId(value: string | null): value is PaymentMethodId {
  return value !== null && PAYMENT_METHOD_IDS.has(value)
}

function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return true
  const userAgent = navigator.userAgent
  const iPadDesktopMode = /Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1
  return iPadDesktopMode || /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(userAgent)
}

export function checkoutModeFor(method: PaymentMethodId | "card"): string {
  if (DIRECT_WALLET_METHODS.includes(method as PaymentMethodId)) return "qr"
  // Desktop WeChat opens the validated hosted checkout URL as a QR code.
  if (method === "wechatpay" && !isMobileBrowser()) return "pc"
  return "h5"
}
