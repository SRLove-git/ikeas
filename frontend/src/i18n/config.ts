export const SUPPORTED_LOCALES = ["zh-CN", "en"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "zh-CN"

/** Cookie + localStorage key shared by the client switcher and server locale reader. */
export const LOCALE_STORAGE_KEY = "buzud.locale"

export function isLocale(value: unknown): value is Locale {
  return value === "zh-CN" || value === "en"
}

/** Maps a detected i18next language string to one of our supported locales. */
export function normalizeLocale(value: string | undefined | null): Locale {
  if (value && value.toLowerCase().startsWith("en")) return "en"
  return DEFAULT_LOCALE
}
