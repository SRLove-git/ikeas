"use client"

import { useTranslation } from "react-i18next"
import { useLocale } from "@/i18n/LanguageProvider"
import type { Locale } from "@/i18n/config"

interface LanguageSwitchProps {
  className?: string
  /** Optional public URLs. When provided, only mapped locales render as crawlable links. */
  hrefs?: Partial<Record<Locale, string>>
}

/** Compact EN | 中文 | MS | ID switch used by the storefront header and admin shell. */
export function LanguageSwitch({ className, hrefs }: LanguageSwitchProps) {
  const { t } = useTranslation()
  const { locale, changeLanguage } = useLocale()
  const switchTo = (next: Locale) => () => changeLanguage(next)
  const noticeKey: Record<Locale, string> = {
    "zh-CN": "notice.chinese",
    en: "notice.english",
    ms: "notice.malay",
    id: "notice.indonesian",
  }

  const languages = (["en", "zh-CN", "ms", "id"] as const).filter(
    (code) => !hrefs || Boolean(hrefs[code]),
  )

  return (
    <div className={`nav-header-message-language-switch ${className ?? ""}`}>
      {languages.map((code, index) => {
        const href = hrefs?.[code]
        const classNames = `lang-switch-btn ${locale === code ? "lang-switch-btn--active" : ""}`
        return (
          <span key={code} className="inline-flex items-center">
            {index > 0 ? <span className="lang-separator mx-1 opacity-50">|</span> : null}
            {href ? (
              <a
                href={href}
                className={classNames}
                aria-current={locale === code ? "page" : undefined}
                hrefLang={code}
              >
                {t(noticeKey[code])}
              </a>
            ) : (
              <button
                type="button"
                className={classNames}
                aria-pressed={locale === code}
                onClick={switchTo(code)}
              >
                {t(noticeKey[code])}
              </button>
            )}
          </span>
        )
      })}
    </div>
  )
}
