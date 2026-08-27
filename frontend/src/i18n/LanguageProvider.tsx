"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { I18nextProvider } from "react-i18next"
import { useRouter } from "next/navigation"
import { createClientI18n } from "./client"
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
} from "./config"

/** Best-effort detection of the visitor's browser/system language. */
function detectBrowserLocale(): Locale | undefined {
  if (typeof navigator === "undefined") return undefined
  const candidates: string[] = []
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages)
  if (navigator.language) candidates.push(navigator.language)
  // Older IE exposes the system language here; harmless elsewhere.
  const userLanguage = (navigator as Navigator & { userLanguage?: string }).userLanguage
  if (userLanguage) candidates.push(userLanguage)
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate)
    if (locale) return locale
  }
  return undefined
}

interface LanguageContextValue {
  locale: Locale
  changeLanguage: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  changeLanguage: () => {},
})

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const i18n = useMemo(() => createClientI18n(initialLocale), [initialLocale])

  useEffect(() => {
    document.documentElement.lang = initialLocale
  }, [initialLocale])

  // Auto-detect the system/browser language on first visit only. Once the
  // visitor has a stored preference (cookie) we leave their explicit choice
  // untouched; the server normally already resolves the right locale via the
  // `Accept-Language` header, so this is a client-side safety net for cases
  // where that header is missing or the page was served from a static cache.
  useEffect(() => {
    const hasStoredPreference = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${LOCALE_STORAGE_KEY}=`))
    if (hasStoredPreference) return

    const detected = detectBrowserLocale()
    if (!detected || detected === initialLocale) return

    // 挂载时一次性把浏览器检测到的语言同步进 state（非级联渲染的常规 setState）。
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部系统（浏览器语言）一次性同步
    setLocale(detected)
    document.documentElement.lang = detected
    document.cookie = `${LOCALE_STORAGE_KEY}=${detected}; path=/; max-age=31536000; samesite=lax`
    void i18n.changeLanguage(detected).then(() => router.refresh())
  }, [initialLocale, i18n, router])

  const changeLanguage = useCallback(
    (next: Locale) => {
      if (next === locale) return
      setLocale(next)
      document.documentElement.lang = next
      document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`
      void i18n.changeLanguage(next).then(() => {
        // Re-render server components (menu, products, footer copy) in the new locale.
        router.refresh()
      })
    },
    [i18n, locale, router],
  )

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={{ locale, changeLanguage }}>
        {children}
      </LanguageContext.Provider>
    </I18nextProvider>
  )
}

export function useLocale(): LanguageContextValue {
  return useContext(LanguageContext)
}
