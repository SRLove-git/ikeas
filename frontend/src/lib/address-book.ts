export interface ShippingAddress {
  id: string
  name: string
  phone: string
  postalCode: string
  detail: string
  isDefault: boolean
}

const ADDRESS_KEY = "buzud_shipping_addresses"
const SINGAPORE_POSTAL_CODE = /^\d{6}$/

interface StoredShippingAddress extends Partial<ShippingAddress> {
  region?: unknown
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function postalCodeFrom(...values: string[]): string {
  for (const value of values) {
    const exact = value.match(SINGAPORE_POSTAL_CODE)
    if (exact) return exact[0]
    const embedded = value.match(/(?:^|\D)(\d{6})(?:\D|$)/)
    if (embedded) return embedded[1]
  }
  return ""
}

function normalizeAddress(value: unknown): ShippingAddress | null {
  if (!value || typeof value !== "object") return null
  const stored = value as StoredShippingAddress
  const legacyRegion = text(stored.region)
  const storedDetail = text(stored.detail)
  const postalCode = postalCodeFrom(text(stored.postalCode), legacyRegion, storedDetail)
  const detailWithoutPostal = postalCode
    ? storedDetail.replace(new RegExp(`(?:^|\\s)${postalCode}(?=\\s|$)`), " ").trim()
    : storedDetail
  const detail =
    !postalCode && legacyRegion
      ? `${legacyRegion} ${detailWithoutPostal}`.trim()
      : detailWithoutPostal

  return {
    id: text(stored.id),
    name: text(stored.name),
    phone: text(stored.phone),
    postalCode,
    detail,
    isDefault: stored.isDefault === true,
  }
}

export function isSingaporePostalCode(value: string): boolean {
  return SINGAPORE_POSTAL_CODE.test(value.trim())
}

export function createShippingAddressId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function readShippingAddresses(): ShippingAddress[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ADDRESS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(normalizeAddress)
      .filter((address): address is ShippingAddress => address !== null)
  } catch {
    return []
  }
}

export function writeShippingAddresses(addresses: ShippingAddress[]): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses))
}
