"use client"

import { createInstance, type i18n as I18nInstance } from "i18next"
import { initReactI18next } from "react-i18next"
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from "./config"
import zh from "./locales/zh/common.json"
import en from "./locales/en/common.json"

const resources = {
  "zh-CN": { common: zh },
  en: { common: en },
} as const

// Module-level mirror of the active locale, so non-component helpers
// (e.g. adminFetch) can localize error strings without a React context.
let activeLocale: Locale = DEFAULT_LOCALE;

export function getActiveLocale(): Locale {
  return activeLocale;
}

/**
 * Creates a client i18next instance locked to the locale the server resolved
 * for this request (cookie → Accept-Language → default), so server-rendered
 * HTML and the first client render are always in the same language.
 */
export function createClientI18n(lng: Locale): I18nInstance {
  activeLocale = lng;
  const instance = createInstance()
  instance.use(initReactI18next)
  instance.on("languageChanged", (next) => {
    activeLocale = normalizeLocale(next)
  })
  void instance.init({
    resources,
    lng,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ["zh-CN", "en"],
    defaultNS: "common",
    ns: ["common"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  return instance
}
