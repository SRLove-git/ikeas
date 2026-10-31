"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { I18nextProvider } from "react-i18next"
import { useRouter } from "next/navigation"
import { createClientI18n } from "./client"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, type Locale } from "./config"

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
