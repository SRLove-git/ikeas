"use client"

import { useTranslation } from "react-i18next"
import { useLocale } from "@/i18n/LanguageProvider"
import type { Locale } from "@/i18n/config"

interface LanguageSwitchProps {
  className?: string
}

/** Compact 中文 | EN switch used by the storefront notice bar and the admin shell. */
export function LanguageSwitch({ className }: LanguageSwitchProps) {
  const { t } = useTranslation()
  const { locale, changeLanguage } = useLocale()
  const switchTo = (next: Locale) => () => changeLanguage(next)

  return (
    <div className={`nav-header-message-language-switch ${className ?? ""}`}>
      <button
        type="button"
        className={`lang-switch-btn ${locale === "zh-CN" ? "lang-switch-btn--active" : ""}`}
        onClick={switchTo("zh-CN")}
      >
        {t("notice.chinese")}
      </button>
      <span className="lang-separator mx-1 opacity-50">|</span>
      <button
        type="button"
        className={`lang-switch-btn ${locale === "en" ? "lang-switch-btn--active" : ""}`}
        onClick={switchTo("en")}
      >
        {t("notice.english")}
      </button>
    </div>
  )
}
