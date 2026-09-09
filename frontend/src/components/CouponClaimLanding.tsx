"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"
import { GiftIcon } from "@/components/icons"

interface ClaimResult {
  code: string
  name: string
  alreadyClaimed: boolean
  linkedToAccount: boolean
  message: string
}

export function CouponClaimLanding() {
  const { t } = useTranslation()
  const [couponCode, setCouponCode] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ClaimResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code") ?? ""
    setCouponCode(code.trim().toUpperCase())
  }, [])

  const submit = async () => {
    setError(null)
    if (!couponCode) {
      setError(t("couponClaim.missingCode"))
      return
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(t("couponClaim.invalidEmail"))
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/marketing/coupons/claim-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, code: couponCode }),
      })
      const body = (await response.json().catch(() => null)) as
        (ClaimResult & { error?: string }) | null
      if (!response.ok) {
        throw new Error(body?.message ?? body?.error ?? t("couponClaim.genericFailed"))
      }
      if (body) {
        setResult(body)
      } else {
        setError(t("couponClaim.genericFailed"))
      }
    } catch (e) {
      setError((e as Error).message || t("couponClaim.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-ikea flex min-h-[70vh] items-center justify-center bg-white px-5 py-12 text-ikea-black">
      <div className="w-full max-w-xl text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-ikea-blue text-white">
          <GiftIcon width={32} height={32} />
        </span>
        <h1 className="mt-6 text-2xl font-bold leading-9">{t("couponClaim.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-ikea-muted">{t("couponClaim.intro")}</p>

        {result ? (
          <div className="mt-8 rounded-lg border border-ikea-gray-200 bg-ikea-gray-50 p-6 text-left">
            <h2 className="text-base font-bold">
              {result.alreadyClaimed
                ? t("couponClaim.alreadyTitle")
                : t("couponClaim.successTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ikea-muted">{result.message}</p>
            <div className="mt-5 rounded-md border border-dashed border-ikea-gray-300 bg-white p-4">
              <p className="text-xs text-ikea-muted">{t("couponClaim.codeLabel")}</p>
              <p className="mt-1 font-mono text-xl font-bold text-ikea-blue">{result.code}</p>
              <p className="mt-1 text-sm">{result.name}</p>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/zh/profile/login/"
                className="i-btn i-btn--primary flex h-11 items-center justify-center px-8 text-sm font-bold text-white"
              >
                {t("couponClaim.login")}
              </Link>
              <Link
                href="/zh/all-products/"
                className="i-btn i-btn--secondary flex h-11 items-center justify-center px-8 text-sm font-bold"
              >
                {t("couponClaim.browse")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-md">
            <div className="mt-4 text-left">
              <label className="block text-sm font-bold">{t("couponClaim.emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !submitting) void submit()
                }}
                placeholder={t("couponClaim.emailPlaceholder")}
                className="mt-2 h-11 w-full rounded border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
            </div>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="mt-6 flex h-11 w-full items-center justify-center rounded bg-ikea-blue px-8 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-ikea-gray-300"
            >
              {submitting ? t("couponClaim.submitting") : t("couponClaim.submit")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
