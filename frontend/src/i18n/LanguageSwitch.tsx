"use client"

import { useTranslation } from "react-i18next"
import { useLocale } from "@/i18n/LanguageProvider"
import type { Locale } from "@/i18n/config"

interface LanguageSwitchProps {
  className?: string
}

/** Compact 中文 | EN | MS | ID switch used by the storefront header and admin shell. */
export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const { t } = useTranslation()
  const { locale, changeLanguage } = useLocale()
  const switchTo = (next: Locale) => () => changeLanguage(next)
  const noticeKey: Record<Locale, string> = {
    "zh-CN": "notice.chinese",
    en: "notice.english",
    ms: "notice.malay",
    id: "notice.indonesian",
  }

  return (
    <div className={`nav-header-message-language-switch ${className ?? ""}`}>
      {(["zh-CN", "en", "ms", "id"] as const).map((code, index) => (
        <span key={code} className="inline-flex items-center">
          {index > 0 ? <span className="lang-separator mx-1 opacity-50">|</span> : null}
          <button
            type="button"
            className={`lang-switch-btn ${locale === code ? "lang-switch-btn--active" : ""}`}
            onClick={switchTo(code)}
          >
            {t(noticeKey[code])}
          </button>
        </span>
      ))}
    </div>
  )
}
