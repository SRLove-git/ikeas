export interface ShippingAddress {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

const ADDRESS_KEY = "buzud_shipping_addresses"

export function readShippingAddresses(): ShippingAddress[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ADDRESS_KEY)
    const parsed = raw ? (JSON.parse(raw) as ShippingAddress[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
