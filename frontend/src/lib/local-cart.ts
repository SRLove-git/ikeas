import { apiJson, type CartItem, type ProductAvailability } from "@/lib/api"

const LOCAL_CART_KEY = "buzud_local_cart"

function cartChangedDetail(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function readLocalCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(LOCAL_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as CartItem[]) : []
  } catch {
    return []
  }
}

export function writeLocalCart(items: CartItem[]): CartItem[] {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: cartChangedDetail(items) }))
  }
  return items
}

export function addLocalItem(item: CartItem): CartItem[] {
  const items = readLocalCart()
  const existing = items.find((entry) => entry.productId === item.productId)
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + item.quantity)
  } else {
    items.push(item)
  }
  return writeLocalCart(items)
}

/** Refresh guest-cart prices and sellability from the same public snapshot used at checkout. */
export async function refreshLocalCartAvailability(items: CartItem[]): Promise<CartItem[]> {
  const refreshed = await Promise.all(
    items.map(async (item) => {
      try {
        const availability = await apiJson<ProductAvailability>(
          `/products/${encodeURIComponent(item.productId)}/availability`,
        )
        return {
          ...item,
          product: {
            ...item.product,
            price: availability.price ?? item.product.price,
          },
          sellable: availability.sellable,
          availabilityReason: availability.reason,
        }
      } catch {
        return {
          ...item,
          sellable: false,
          availabilityReason: "OMS_SNAPSHOT_UNAVAILABLE" as const,
        }
      }
    }),
  )
  return writeLocalCart(refreshed)
}

export function updateLocalQuantity(productId: string, quantity: number): CartItem[] {
  const items = readLocalCart()
  const next =
    quantity <= 0
      ? items.filter((entry) => entry.productId !== productId)
      : items.map((entry) =>
          entry.productId === productId ? { ...entry, quantity: Math.min(99, quantity) } : entry,
        )
  return writeLocalCart(next)
}

export function clearLocalCart(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(LOCAL_CART_KEY)
  window.dispatchEvent(new CustomEvent("ikea:cart-changed", { detail: 0 }))
}
