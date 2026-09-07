// Client/server helpers for the Spring Boot backend (server/).

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080"
export const API_V1 = `${API_BASE}/api/v1`

const TOKEN_KEY = "ikea_token"
const REFRESH_TOKEN_KEY = "ikea_refresh_token"

const REFRESH_EXCLUDED_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/sms/login",
  "/auth/sms/send",
  "/auth/refresh",
])

export interface User {
  id: string
  name: string
  phone: string | null
  email: string | null
  createdAt: string
}

export interface AuthResponse {
  token: string
  refreshToken?: string
  expiresIn?: number
  tokenType?: string
  user: User
}

export interface ProductLabel {
  text: string
  backgroundColor?: string
  textColor?: string
}

export interface Product {
  id: string
  slug: string
  name: string
  productType?: string | null
  designText?: string | null
  price: number | null
  originalPrice?: number | null
  image: string | null
  labels: ProductLabel[]
  detail?: unknown
  categoryNames?: string[]
}

export interface CartItem {
  productId: string
  quantity: number
  product: Product
}

export interface Cart {
  items: CartItem[]
  totalQuantity: number
  totalPrice: number
}

export interface Favorites {
  items: Product[]
  ids: string[]
}

export interface OrderItemResponse {
  productId: string
  productName: string
  image: string | null
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface OrderResponse {
  id: number
  orderNo: string
  status: number
  statusLabel: string
  currency: string
  subtotal: number
  deliveryFee: number
  totalAmount: number
  customer: string | null
  phone: string | null
  address: string | null
  remark: string | null
  items: OrderItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface PaymentOptions {
  mockOnly: boolean
  stripePublicKey: string
}

export interface CreatePaymentResponse {
  mockOnly: boolean
  channel: string
  payUrl: string | null
}

export interface LogisticsView {
  carrier: string | null
  trackingNo: string | null
  status: string | null
  traces: string[]
  updatedAt: string | null
}

export interface InvoiceReceiptView {
  id: number
  orderNo: string
  kind: number
  companyName: string | null
  taxNumber: string | null
  email: string | null
  status: number
  fileUrl: string | null
  errorMessage: string | null
  createdAt: string
}

export interface StockAlertView {
  id: number
  productId: string
  contact: string
  status: number
  notifiedAt: string | null
  createdAt: string
}

export interface AfterSaleView {
  id: number
  orderNo: string
  type: number
  reason: string | null
  status: number
  omsReturnNo: string | null
  createdAt: string
}

export interface OrderFulfillmentView {
  logistics: LogisticsView | null
  latestInvoice: InvoiceReceiptView | null
  stockAlert: StockAlertView | null
  afterSale: AfterSaleView | null
}

export interface ReferralRewardView {
  id: number
  couponName: string
  value: number | null
  minAmount: number | null
  earnedAt: string | null
  inviteeName: string
}

export interface ReferralSummary {
  code: string
  referralCount: number
  issuedCouponCount: number
  nextMilestone: number
  progress: number
  rewards: ReferralRewardView[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(TOKEN_KEY)
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function setAuthTokens(accessToken: string, refreshToken?: string | null) {
  setToken(accessToken)
  setRefreshToken(refreshToken ?? null)
}

export function clearAuthTokens() {
  setToken(null)
  setRefreshToken(null)
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  const token = getToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  return headers
}

let refreshPromise: Promise<AuthResponse | null> | null = null

async function refreshAccessToken(): Promise<AuthResponse | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_V1}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok || !body?.token) {
          clearAuthTokens()
          return null
        }
        setAuthTokens(body.token, body.refreshToken ?? null)
        return body as AuthResponse
      } catch {
        clearAuthTokens()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }

  return refreshPromise
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let response = await fetch(`${API_V1}${path}`, {
    ...options,
    headers: buildHeaders(options),
  })

  if (response.status === 401 && !REFRESH_EXCLUDED_PATHS.has(path) && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      response = await fetch(`${API_V1}${path}`, {
        ...options,
        headers: buildHeaders(options),
      })
    }
  }

  return response
}

export async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await apiFetch(path, options)
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message = body?.message ?? `请求失败 (${response.status})`
    throw new ApiError(response.status, message)
  }
  return body as T
}
