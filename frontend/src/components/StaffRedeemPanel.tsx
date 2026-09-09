"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"

const SECRET_STORAGE_KEY = "buzud.staff.redeemSecret"

interface BookingResult {
  bookingNo: string
  customerName: string
  phone: string
  email: string
  serviceType: string
  store: string
  preferredDate: string
  timeSlot?: string | null
  status: number
}

export function StaffRedeemPanel() {
  const { t } = useTranslation()
  const [secret, setSecret] = useState(() => {
    if (typeof window === "undefined") return ""
    return window.sessionStorage.getItem(SECRET_STORAGE_KEY) ?? ""
  })
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<BookingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setResult(null)
    if (!secret.trim()) {
      setError(t("staffRedeem.missingSecret"))
      return
    }
    if (!code.trim()) {
      setError(t("staffRedeem.missingCode"))
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim(), code: code.trim() }),
      })
      const body = (await response.json().catch(() => null)) as
        (BookingResult & { message?: string }) | null
      if (!response.ok) {
        throw new Error(body?.message ?? t("staffRedeem.failed"))
      }
      if (body) {
        setResult(body)
        window.sessionStorage.setItem(SECRET_STORAGE_KEY, secret.trim())
        setCode("")
      }
    } catch (e) {
      setError((e as Error).message || t("staffRedeem.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-ikea flex min-h-screen items-center justify-center bg-ikea-gray-100 px-5 py-10 text-ikea-black">
      <div className="w-full max-w-lg">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold leading-9">{t("staffRedeem.title")}</h1>
          <p className="mt-2 text-sm leading-6 text-ikea-muted">{t("staffRedeem.intro")}</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold">{t("staffRedeem.secretLabel")}</span>
              <input
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder={t("staffRedeem.secretPlaceholder")}
                className="mt-1.5 h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">{t("staffRedeem.codeLabel")}</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !submitting) void submit()
                }}
                placeholder={t("staffRedeem.codePlaceholder")}
                className="mt-1.5 h-11 w-full border border-ikea-gray-200 px-4 text-sm uppercase outline-none focus:border-ikea-blue"
              />
            </label>

            {error ? (
              <p className="rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            ) : null}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="i-btn i-btn--primary h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="i-btn__inner">
                <span className="i-btn__label">
                  {submitting ? t("staffRedeem.submitting") : t("staffRedeem.submit")}
                </span>
              </span>
            </button>
          </div>

          {result ? (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-5 text-sm">
              <p className="font-bold text-green-700">{t("staffRedeem.success")}</p>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-ikea-muted">{t("staffRedeem.bookingNo")}</dt>
                  <dd className="font-mono font-bold">{result.bookingNo}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ikea-muted">{t("staffRedeem.customer")}</dt>
                  <dd>{result.customerName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ikea-muted">{t("staffRedeem.service")}</dt>
                  <dd>{result.serviceType}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ikea-muted">{t("staffRedeem.store")}</dt>
                  <dd>{result.store}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
