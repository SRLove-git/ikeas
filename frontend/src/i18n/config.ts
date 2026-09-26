export const SUPPORTED_LOCALES = ["zh-CN", "en", "ms", "id"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "zh-CN"

/** Cookie + localStorage key shared by the client switcher and server locale reader. */
export const LOCALE_STORAGE_KEY = "buzud.locale"

export function isLocale(value: unknown): value is Locale {
  return (
    value === "zh-CN" ||
    value === "en" ||
    value === "ms" ||
    value === "id"
  )
}

/** Maps a detected i18next language string to one of our supported locales. */
export function normalizeLocale(value: string | undefined | null): Locale {
  // `accept-language` can be a comma-separated, priority-weighted list
  // (e.g. "zh-CN,zh;q=0.9,en;q=0.8"), so always inspect the first token.
  const first = value?.trim().toLowerCase().split(/[,\s]/)[0]
  if (!first) return DEFAULT_LOCALE
  // Malay (Bahasa Melayu): ms, ms-my, ms-bn, zsm, ...
  if (first === "ms" || first.startsWith("ms-") || first.startsWith("ms_") || first === "zsm") {
    return "ms"
  }
  // Indonesian (Bahasa Indonesia): id, in, id-id, in-id, ...
  if (first === "id" || first.startsWith("id-") || first.startsWith("id_") ||
      first === "in" || first.startsWith("in-") || first.startsWith("in_")) {
    return "id"
  }
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

/**
 * Domain suffix → locale mapping used for automatic language selection.
 * Visiting `*.com.my` (Malaysia) resolves to Malay, `*.co.id` (Indonesia)
 * resolves to Indonesian, and `*.cn` (China) resolves to Chinese. Any other
 * host falls through to Accept-Language / the default locale.
 */
export const DOMAIN_LOCALE_SUFFIXES: ReadonlyArray<{ suffix: string; locale: Locale }> = [
  { suffix: ".com.my", locale: "ms" },
  { suffix: ".my", locale: "ms" },
  { suffix: ".co.id", locale: "id" },
  { suffix: ".id", locale: "id" },
  { suffix: ".com.cn", locale: "zh-CN" },
  { suffix: ".cn", locale: "zh-CN" },
]

/** Resolves a request Host header to a locale, or `undefined` when no suffix matches. */
export function localeFromHost(host: string | undefined | null): Locale | undefined {
  if (!host) return undefined
  // Strip an optional trailing port (e.g. "localhost:3000" or "buzud.com.my:443").
  const bare = host.toLowerCase().trim().replace(/:\d+$/, "")
  if (!bare) return undefined
  for (const { suffix, locale } of DOMAIN_LOCALE_SUFFIXES) {
    if (bare.endsWith(suffix)) return locale
  }
  return undefined
}

/**
 * Ordered list of file-name suffixes to try when resolving localized CMS data.
 * An empty string refers to the base (Chinese source) file. Malay/Indonesian
 * content falls back to English before Chinese so visitors to those locales
 * never see untranslated Chinese product copy.
 */
export function localeFileSuffixes(locale: Locale): string[] {
  switch (locale) {
    case "zh-CN":
      return [""]
    case "en":
      return ["en", ""]
    case "ms":
      return ["ms", "en", ""]
    case "id":
      return ["id", "en", ""]
  }
}

/** BCP 47 locale used for `Intl`/`Date.prototype.toLocaleString` formatting. */
export function intlLocale(locale: Locale): string {
  switch (locale) {
    case "zh-CN":
      return "zh-CN"
    case "en":
      return "en-SG"
    case "ms":
      return "ms-MY"
    case "id":
      return "id-ID"
  }
}
