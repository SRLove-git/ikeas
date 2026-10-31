import { cookies, headers } from "next/headers"
import { createInstance } from "i18next"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, localeFromHost, type Locale } from "./config"
import zh from "./locales/zh/common.json"
import en from "./locales/en/common.json"
import ms from "./locales/ms/common.json"
import id from "./locales/id/common.json"

const resources = {
  "zh-CN": { common: zh },
  en: { common: en },
  ms: { common: ms },
  id: { common: id },
} as const

/**
 * Current locale for server-rendered data, resolved with this priority:
 * cookie (explicit choice) → domain suffix → English default.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const store = await cookies()
    const cookie = store.get(LOCALE_STORAGE_KEY)?.value
    if (isLocale(cookie)) return cookie
  } catch {
    // no cookie store (build-time / static generation) — fall through
  }
  try {
    const headerList = await headers()
    const hostLocale = localeFromHost(headerList.get("host"))
    if (hostLocale) return hostLocale
    return DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

/**
 * Server-side `t` bound to the request locale. Creates a throwaway instance
 * per request so concurrent renders never race on shared language state.
 */
export async function getServerT(
  locale?: Locale,
): Promise<(key: string, vars?: Record<string, unknown>) => string> {
  const resolved = locale ?? (await getLocale())
  const instance = createInstance()
  await instance.init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
  })
  return instance.getFixedT(resolved, "common")
}
