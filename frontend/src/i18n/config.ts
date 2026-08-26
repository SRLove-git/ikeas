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
  // `accept-language` can be a comma-separated, priority-weighted list
  // (e.g. "zh-CN,zh;q=0.9,en;q=0.8"), so always inspect the first token.
  const first = value?.trim().toLowerCase().split(/[,\s]/)[0]
  if (!first) return DEFAULT_LOCALE
  // English variants: en, en-us, en-gb, en-sg, ...
  if (first === "en" || first.startsWith("en-") || first.startsWith("en_")) {
    return "en"
  }
  // Chinese variants (simplified/traditional all map to the store's
  // simplified-Chinese locale): zh, zh-cn, zh-hans, zh-hant, zh-tw, ...
  if (first === "zh" || first.startsWith("zh-") || first.startsWith("zh_")) {
    return "zh-CN"
  }
  return DEFAULT_LOCALE
}
