"use client"

import Link from "next/link"
import { useTranslation } from "react-i18next"

interface BreadcrumbsProps {
  currentLabel: string
  className?: string
}

/**
 * Simple two-level breadcrumb: 首页 / 当前页. Intermediate pages are never
 * shown, no matter how the user navigated here.
 */
export function Breadcrumbs({ currentLabel, className = "mb-6" }: BreadcrumbsProps) {
  const { t } = useTranslation()
  return (
    <nav className={`flex flex-wrap items-center gap-2 text-sm text-ikea-muted ${className}`}>
      <Link href="/" className="hover:text-ikea-black">
        {t("breadcrumbs.home")}
      </Link>
      <span>/</span>
      <span className="text-ikea-black">{currentLabel}</span>
    </nav>
  )
}
