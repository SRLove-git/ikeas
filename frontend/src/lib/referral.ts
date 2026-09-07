const STORAGE_KEY = "buzud.referralCode"
const COOKIE_KEY = "buzud_referral_code"

export function saveReferralCode(code: string | null): void {
  if (typeof window === "undefined") return
  const value = code?.trim() ?? ""
  if (value) {
    window.localStorage.setItem(STORAGE_KEY, value)
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`
  } else {
    clearReferralCode()
  }
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null
  const fromStorage = window.localStorage.getItem(STORAGE_KEY)
  if (fromStorage) return fromStorage

  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(`${COOKIE_KEY}=`))
  if (!cookie) return null
  return decodeURIComponent(cookie.slice(COOKIE_KEY.length + 1))
}

export function clearReferralCode(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; samesite=lax`
}
