"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GiftIcon } from "@/components/icons"
import { useAuth } from "@/lib/auth"
import { API_BASE, apiJson, getToken } from "@/lib/api"

interface PhysicalVoucher {
  id: string
  code: string
  type: number
  status: number
  validUntil?: string | null
  orderNo?: string | null
  usedBookingId?: string | null
  createdAt: string
}

function voucherStatusLabel(
  t: (key: string) => string,
  voucher: PhysicalVoucher,
): string {
  if (voucher.status === 1) return t("profile.voucherUsed")
  if (voucher.status === 2) return t("profile.voucherDisabled")
  if (voucher.status === 3) return t("profile.voucherInvalid")
  return t("profile.voucherUnused")
}

export function MyVouchersPanel() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, ready } = useAuth()
  const [vouchers, setVouchers] = useState<PhysicalVoucher[]>([])
  const [voucherNotice, setVoucherNotice] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [autoRedeeming, setAutoRedeeming] = useState(false)
  const [autoRedeemResult, setAutoRedeemResult] = useState<{
    experienceCode: string
    usedPointCodes: string[]
  } | null>(null)
  const [sendingEmailCode, setSendingEmailCode] = useState<string | null>(null)

  useEffect(() => {
    if (ready && !user) {
      router.replace("/zh/profile/login/")
      return
    }
    if (ready && user) {
      let cancelled = false
      void (async () => {
        try {
          const data = await apiJson<PhysicalVoucher[]>("/experience-vouchers/mine")
          if (!cancelled) setVouchers(data)
        } catch {
          if (!cancelled) setVouchers([])
        }
      })()
      return () => {
        cancelled = true
      }
    }
  }, [ready, user, router])

  const downloadPointsPdf = async () => {
    setDownloadingPdf(true)
    setVoucherNotice(null)
    try {
      const response = await fetch(`${API_BASE}/api/v1/experience-vouchers/mine.pdf`, {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      })
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const disposition = response.headers.get("content-disposition") ?? ""
      const match = /filename="?([^"]+)"?/.exec(disposition)
      link.href = url
      link.download = match?.[1] ?? "buzud-points-cards.pdf"
      link.click()
      URL.revokeObjectURL(url)
    } catch (ex) {
      setVoucherNotice(ex instanceof Error ? ex.message : t("profile.voucherAutoRedeemFailed"))
    } finally {
      setDownloadingPdf(false)
    }
  }

  const autoRedeemPoints = async () => {
    setAutoRedeeming(true)
    setVoucherNotice(null)
    setAutoRedeemResult(null)
    try {
      const result = await apiJson<{ experienceCode: string; usedPointCodes: string[] }>(
        "/experience-vouchers/auto-redeem-points",
        { method: "POST" },
      )
      setAutoRedeemResult(result)
      setVoucherNotice(t("profile.voucherAutoRedeemSuccess", { code: result.experienceCode }))
      const updated = await apiJson<PhysicalVoucher[]>("/experience-vouchers/mine")
      setVouchers(updated)
    } catch (ex) {
      setVoucherNotice(ex instanceof Error ? ex.message : t("profile.voucherAutoRedeemFailed"))
    } finally {
      setAutoRedeeming(false)
    }
  }

  const sendVoucherEmail = async (voucher: PhysicalVoucher) => {
    const email = window.prompt(t("profile.voucherEmailPrompt"))
    if (!email || !email.trim()) return
    setSendingEmailCode(voucher.code)
    setVoucherNotice(null)
    try {
      await apiJson(`/experience-vouchers/${encodeURIComponent(voucher.code)}/email`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      })
      setVoucherNotice(t("profile.voucherEmailSuccess", { email: email.trim() }))
    } catch (ex) {
      setVoucherNotice(ex instanceof Error ? ex.message : t("profile.voucherAutoRedeemFailed"))
    } finally {
      setSendingEmailCode(null)
    }
  }

  if (!ready || !user) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("profile.loading")}
      </div>
    )
  }

  const unusedPoints = vouchers.filter((voucher) => voucher.type === 2 && voucher.status === 0)
  const hasPoints = vouchers.some((voucher) => voucher.type === 2)

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("profile.vouchers")} />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold leading-9">{t("profile.vouchers")}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {unusedPoints.length >= 3 ? (
              <button
                type="button"
                disabled={autoRedeeming}
                onClick={() => void autoRedeemPoints()}
                className="i-btn i-btn--primary h-9 px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                {autoRedeeming
                  ? t("profile.voucherAutoRedeeming")
                  : t("profile.voucherAutoRedeem")}
              </button>
            ) : null}
            {hasPoints ? (
              <button
                type="button"
                disabled={downloadingPdf}
                onClick={() => void downloadPointsPdf()}
                className="i-btn i-btn--secondary h-9 px-4 text-sm font-bold text-ikea-black disabled:opacity-50"
              >
                {t("profile.voucherDownloadPdf")}
              </button>
            ) : null}
          </div>
        </div>

        {voucherNotice ? (
          <p className="mt-4 rounded bg-blue-50 px-4 py-3 text-sm text-ikea-blue">{voucherNotice}</p>
        ) : null}

        {autoRedeemResult ? (
          <div className="mt-4 rounded-md bg-white px-4 py-3 text-sm">
            <p className="font-bold">{t("profile.voucherAutoRedeemedTitle")}</p>
            <p className="mt-1 font-mono text-xs font-bold text-ikea-blue">
              {autoRedeemResult.experienceCode}
            </p>
            <p className="mt-1 text-xs text-ikea-muted">
              {t("profile.voucherAutoRedeemedUsed", {
                codes: autoRedeemResult.usedPointCodes.join(", "),
              })}
            </p>
          </div>
        ) : null}

        {vouchers.length === 0 ? (
          <div className="mt-6 bg-white px-6 py-20 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ikea-gray-100 text-ikea-muted">
              <GiftIcon width={28} height={28} />
            </span>
            <p className="mt-4 text-sm text-ikea-muted">{t("profile.voucherNoPoints")}</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
            <div className="hidden grid-cols-[1fr_120px_120px_140px] gap-4 border-b border-ikea-gray-100 bg-ikea-gray-50 px-5 py-3 text-xs font-bold text-ikea-muted md:grid">
              <span>{t("profile.voucherCode")}</span>
              <span>{t("profile.voucherType")}</span>
              <span>{t("profile.voucherStatus")}</span>
              <span className="text-right">{t("profile.voucherActions")}</span>
            </div>
            <div className="divide-y divide-ikea-gray-100">
              {vouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="grid gap-2 px-5 py-3 text-sm md:grid-cols-[1fr_120px_120px_140px] md:items-center md:gap-4"
                >
                  <span className="break-all font-mono text-xs font-bold">{voucher.code}</span>
                  <span className="text-ikea-muted">
                    {voucher.type === 2 ? t("profile.pointsVoucher") : t("profile.experienceVoucher")}
                  </span>
                  <span className="text-ikea-muted">{voucherStatusLabel(t, voucher)}</span>
                  <span className="md:text-right">
                    {voucher.type === 1 && voucher.status === 0 ? (
                      <button
                        type="button"
                        disabled={sendingEmailCode === voucher.code}
                        onClick={() => void sendVoucherEmail(voucher)}
                        className="text-xs font-bold text-ikea-blue hover:underline disabled:opacity-50"
                      >
                        {sendingEmailCode === voucher.code
                          ? t("profile.voucherEmailSending")
                          : t("profile.voucherSendEmail")}
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
