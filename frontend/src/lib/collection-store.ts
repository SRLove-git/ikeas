// Client-only persistence for the collection page's inspiration saves and
// wishlists. Product favorites are stored in the Spring Boot backend; these
// two lightweight lists are kept in localStorage until they are migrated to
// the backend data model.

export interface Wishlist {
  id: string
  name: string
  productIds: string[]
  createdAt: string
}

const INSPIRATION_KEY = "buzud.collection.inspirationIds"
const WISHLIST_KEY = "buzud.collection.wishlists"

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage)
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable in private browsing; ignore writes.
  }
}

export function getSavedInspirationIds(): string[] {
  const ids = readJson<unknown>(INSPIRATION_KEY, [])
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []
}

export function toggleSavedInspiration(id: string): string[] {
  const current = new Set(getSavedInspirationIds())
  if (current.has(id)) {
    current.delete(id)
  } else {
    current.add(id)
  }
  const next = Array.from(current)
  writeJson(INSPIRATION_KEY, next)
  return next
}

export function getWishlists(): Wishlist[] {
  const lists = readJson<unknown>(WISHLIST_KEY, [])
  if (!Array.isArray(lists)) return []
  return lists.filter(isWishlist)
}

function isWishlist(value: unknown): value is Wishlist {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    Array.isArray(record.productIds) &&
    record.productIds.every((id) => typeof id === "string")
  )
}

function writeWishlists(lists: Wishlist[]) {
  writeJson(WISHLIST_KEY, lists)
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createWishlist(name: string): Wishlist[] {
  const lists = getWishlists()
  const list: Wishlist = {
    id: newId(),
    name: name.trim() || "我的心愿单",
    productIds: [],
    createdAt: new Date().toISOString(),
  }
  const next = [...lists, list]
  writeWishlists(next)
  return next
}

export function renameWishlist(id: string, name: string): Wishlist[] {
  const next = getWishlists().map((list) =>
    list.id === id ? { ...list, name: name.trim() || list.name } : list,
  )
  writeWishlists(next)
  return next
}

export function deleteWishlist(id: string): Wishlist[] {
  const next = getWishlists().filter((list) => list.id !== id)
  writeWishlists(next)
  return next
}

export function addToWishlist(id: string, productId: string): Wishlist[] {
  const next = getWishlists().map((list) =>
    list.id === id && !list.productIds.includes(productId)
      ? { ...list, productIds: [...list.productIds, productId] }
      : list,
  )
  writeWishlists(next)
  return next
}

export function removeFromWishlist(id: string, productId: string): Wishlist[] {
  const next = getWishlists().map((list) =>
    list.id === id
      ? { ...list, productIds: list.productIds.filter((current) => current !== productId) }
      : list,
  )
  writeWishlists(next)
  return next
}
