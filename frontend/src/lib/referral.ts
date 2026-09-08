const STORAGE_KEY = "buzud.referralCode"
const COOKIE_KEY = "buzud_referral_code"

/** 后端生成的邀请码格式为 BUZUD + 数字用户ID，非法或超长的值一律视为无邀请码。 */
function isValidReferralCode(value: string): boolean {
  return /^BUZUD\d{1,27}$/.test(value)
}

export function saveReferralCode(code: string | null): void {
  if (typeof window === "undefined") return
  const value = code?.trim() ?? ""
  if (isValidReferralCode(value)) {
    window.localStorage.setItem(STORAGE_KEY, value)
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`
  } else {
    clearReferralCode()
  }
}

export function getReferralCode(): string | null {
  if (typeof window === "undefined") return null
  const fromStorage = window.localStorage.getItem(STORAGE_KEY)
  if (fromStorage && isValidReferralCode(fromStorage)) return fromStorage

  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(`${COOKIE_KEY}=`))
  const decoded = cookie ? decodeURIComponent(cookie.slice(COOKIE_KEY.length + 1)) : ""
  if (isValidReferralCode(decoded)) return decoded
  // 存在非法或超长的残留邀请码时，顺手清理，避免后续注册误带上触发后端长度校验。
  if (fromStorage || cookie) clearReferralCode()
  return null
}

export function clearReferralCode(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; samesite=lax`
}
