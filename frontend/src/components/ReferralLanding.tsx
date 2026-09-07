"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { GiftIcon } from "@/components/icons"
import { saveReferralCode } from "@/lib/referral"

export function ReferralLanding() {
  const { t } = useTranslation()
  const [code, setCode] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get("ref") ?? params.get("r") ?? ""
    const trimmed = ref.trim()
    if (trimmed) {
      saveReferralCode(trimmed)
      const timer = window.setTimeout(() => setCode(trimmed), 0)
      return () => window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="font-ikea flex min-h-[70vh] items-center justify-center bg-white px-5 py-12 text-ikea-black">
      <div className="w-full max-w-xl text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ikea-blue text-white">
          <GiftIcon width={32} height={32} />
        </span>
        <h1 className="mt-6 text-2xl font-bold leading-9">{t("referral.landingTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-ikea-muted">
          {code ? t("referral.landingWithCode", { code }) : t("referral.landingNoCode")}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/zh/profile/login/"
            className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white"
          >
            {t("referral.landingLogin")}
          </Link>
          <Link
            href="/zh/all-products/"
            className="i-btn i-btn--secondary flex h-11 items-center justify-center px-8 text-sm font-bold"
          >
            {t("referral.landingBrowse")}
          </Link>
        </div>
      </div>
    </div>
  )
}
