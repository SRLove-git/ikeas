"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"
import jsQR from "jsqr"

function todayLocal(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface BookingItem {
  id: string
  bookingNo: string
  customerName: string
  phone: string
  email: string
  voucherCode: string
  voucherCodes?: string | null
  serviceType: string
  store: string
  preferredDate: string
  timeSlot?: string | null
  note?: string | null
  status: number
  createdAt: string
}

function statusLabelKey(status: number): string {
  if (status === 1) return "staffRedeem.statusConfirmed"
  if (status === 2) return "staffRedeem.statusCompleted"
  if (status === 3) return "staffRedeem.statusCancelled"
  return "staffRedeem.statusPending"
}

function statusClassName(status: number): string {
  if (status === 1) return "bg-blue-100 text-blue-700"
  if (status === 2) return "bg-green-100 text-green-700"
  if (status === 3) return "bg-ikea-gray-100 text-ikea-muted"
  return "bg-amber-100 text-amber-700"
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-CN", { hour12: false })
}

export function StaffRedeemPanel() {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [redeemedNo, setRedeemedNo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [claimCode, setClaimCode] = useState("")
  const [claimRemaining, setClaimRemaining] = useState(30)
  const [newSecret, setNewSecret] = useState("")
  const [savingSecret, setSavingSecret] = useState(false)
  const [secretNotice, setSecretNotice] = useState<string | null>(null)
  const [quotaDate, setQuotaDate] = useState(() => todayLocal())
  const [quota, setQuota] = useState<{
    limit: number
    booked: number
    remaining: number
  } | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const stopScanning = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const extractCode = (raw: string): string | null => {
    const value = raw.trim()
    if (!value) return null
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value)
        return url.searchParams.get("voucher") ?? url.searchParams.get("code") ?? null
      } catch {
        return null
      }
    }
    if (/^(BZE|BZP|BK)-/i.test(value)) {
      return value.toUpperCase()
    }
    return null
  }

  const startScanning = async () => {
    setScanError(null)
    setError(null)
    setRedeemedNo(null)
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setScanError(t("staffRedeem.scanUnsupported"))
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      streamRef.current = stream
      setScanning(true)

      const tick = () => {
        const video = videoRef.current
        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          })
          if (decoded) {
            const extracted = extractCode(decoded.data)
            if (extracted) {
              setCode(extracted)
              stopScanning()
              return
            }
          }
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setScanError(t("staffRedeem.scanDenied"))
      setScanning(false)
    }
  }

  useEffect(() => {
    const loadCode = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/staff/claim-code`)
        const body = (await response.json().catch(() => null)) as {
          code?: string
          remainingSeconds?: number
        } | null
        if (response.ok && body?.code) {
          setClaimCode(body.code)
          setClaimRemaining(body.remainingSeconds ?? 30)
        }
      } catch {
        // 获取失败时静默，不影响核销。
      }
    }
    void loadCode()
    const timer = window.setInterval(() => {
      setClaimRemaining((prev) => {
        if (prev <= 1) {
          void loadCode()
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      window.clearInterval(timer)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    const date = quotaDate.trim()
    if (!date) {
      setQuota(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/bookings/quota?date=${encodeURIComponent(date)}`,
        )
        const body = (await response.json().catch(() => null)) as {
          limit?: number
          booked?: number
          remaining?: number
        } | null
        if (response.ok && body?.limit != null && !cancelled) {
          setQuota({
            limit: body.limit,
            booked: body.booked ?? 0,
            remaining: body.remaining ?? 0,
          })
        }
      } catch {
        if (!cancelled) setQuota(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [quotaDate])

  const loadBookings = async () => {
    setLoadingList(true)
    setListError(null)
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/bookings`)
      const body = (await response.json().catch(() => null)) as
        (BookingItem[] & { message?: string }) | null
      if (!response.ok) {
        throw new Error((body as { message?: string } | null)?.message ?? t("staffRedeem.failed"))
      }
      setBookings(Array.isArray(body) ? body : [])
    } catch (e) {
      setListError((e as Error).message || t("staffRedeem.failed"))
    } finally {
      setLoadingList(false)
    }
  }

  const saveClaimSecret = async () => {
    if (!newSecret.trim()) {
      setSecretNotice(t("staffRedeem.secretEmpty"))
      return
    }
    setSavingSecret(true)
    setSecretNotice(null)
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/claim-secret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: newSecret.trim() }),
      })
      const body = (await response.json().catch(() => null)) as { secret?: string; message?: string } | null
      if (!response.ok) {
        throw new Error(body?.message ?? t("staffRedeem.failed"))
      }
      setNewSecret("")
      setSecretNotice(t("staffRedeem.secretUpdated"))
      const codeResponse = await fetch(`${API_BASE}/api/v1/staff/claim-code`)
      const codeBody = (await codeResponse.json().catch(() => null)) as {
        code?: string
        remainingSeconds?: number
      } | null
      if (codeResponse.ok && codeBody?.code) {
        setClaimCode(codeBody.code)
        setClaimRemaining(codeBody.remainingSeconds ?? 30)
      }
    } catch (e) {
      setSecretNotice((e as Error).message || t("staffRedeem.failed"))
    } finally {
      setSavingSecret(false)
    }
  }

  const doRedeem = async (value: string) => {
    setError(null)
    setRedeemedNo(null)
    if (!value.trim()) {
      setError(t("staffRedeem.missingCode"))
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value.trim() }),
      })
      const body = (await response.json().catch(() => null)) as
        (BookingItem & { message?: string }) | null
      if (!response.ok) {
        throw new Error(body?.message ?? t("staffRedeem.failed"))
      }
      if (body) {
        setRedeemedNo(body.bookingNo)
        setCode("")
        await loadBookings()
      }
    } catch (e) {
      setError((e as Error).message || t("staffRedeem.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 px-5 py-8 text-ikea-black">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold leading-9">{t("staffRedeem.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-ikea-muted">{t("staffRedeem.intro")}</p>

        <div className="mt-6 rounded-lg border border-ikea-gray-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold">{t("staffRedeem.quotaTitle")}</h2>
              <p className="mt-1 text-xs leading-5 text-ikea-muted">{t("staffRedeem.quotaHint")}</p>
            </div>
            <input
              type="date"
              value={quotaDate}
              onChange={(event) => setQuotaDate(event.target.value)}
              className="h-10 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
            />
          </div>
          {quota && quota.limit > 0 ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ikea-muted">
                  {t("bookingForm.dailyLimit", { limit: quota.limit })}
                </span>
                <span className="font-bold text-green-600">
                  {t("bookingForm.remainingQuota", { count: quota.remaining })}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ikea-gray-200">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(quota.remaining / quota.limit) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="text-sm font-bold">{t("staffRedeem.codeLabel")}</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !submitting) void doRedeem(code)
                }}
                placeholder={t("staffRedeem.codePlaceholder")}
                className="mt-1.5 h-11 w-full border border-ikea-gray-200 px-4 text-sm uppercase outline-none focus:border-ikea-blue"
              />
            </label>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => void doRedeem(code)}
                disabled={submitting}
                className="i-btn i-btn--primary h-11 px-6 text-sm font-bold text-white disabled:opacity-40"
              >
                {submitting ? t("staffRedeem.submitting") : t("staffRedeem.submit")}
              </button>
              {!scanning ? (
                <button
                  type="button"
                  onClick={() => void startScanning()}
                  className="h-11 rounded border border-ikea-blue px-4 text-sm font-bold text-ikea-blue hover:bg-ikea-blue/5"
                >
                  {t("staffRedeem.scan")}
                </button>
              ) : null}
            </div>
          </div>

          {scanning ? (
            <div className="mt-4 space-y-2">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="aspect-video w-full max-w-md rounded border border-ikea-gray-200 bg-black object-cover"
              />
              <button
                type="button"
                onClick={stopScanning}
                className="rounded bg-ikea-gray-200 px-4 py-2 text-sm font-bold hover:bg-ikea-gray-300"
              >
                {t("staffRedeem.stopScan")}
              </button>
            </div>
          ) : null}

          {scanError ? (
            <p className="mt-3 rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">{scanError}</p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}
          {redeemedNo ? (
            <p className="mt-3 rounded bg-green-50 px-4 py-3 text-sm text-green-700">
              {t("staffRedeem.redeemSuccess", { no: redeemedNo })}
            </p>
          ) : null}

          <div className="mt-5 border-t border-ikea-gray-200 pt-5">
            <h3 className="text-sm font-bold">{t("staffRedeem.claimSecretTitle")}</h3>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-[200px] flex-1">
                <p className="text-xs text-ikea-muted">{t("claimCode.codeLabel")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="font-mono text-2xl font-bold tracking-wider text-ikea-blue">
                    {claimCode || "------"}
                  </p>
                  <span className="text-sm font-bold tabular-nums text-ikea-muted">
                    {claimRemaining}s
                  </span>
                </div>
              </div>
              <input
                value={newSecret}
                onChange={(event) => setNewSecret(event.target.value)}
                placeholder={t("staffRedeem.newSecretPlaceholder")}
                className="h-11 flex-1 border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
              />
              <button
                type="button"
                onClick={() => void saveClaimSecret()}
                disabled={savingSecret}
                className="h-11 rounded bg-ikea-blue px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {savingSecret ? t("staffRedeem.updating") : t("staffRedeem.updateSecret")}
              </button>
            </div>
            {secretNotice ? (
              <p className="mt-3 rounded bg-blue-50 px-4 py-3 text-sm text-ikea-blue">{secretNotice}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-ikea-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">{t("staffRedeem.listTitle")}</h2>
            <button
              type="button"
              onClick={() => void loadBookings()}
              disabled={loadingList}
              className="text-sm font-bold text-ikea-blue hover:underline disabled:opacity-50"
            >
              {t("staffRedeem.refresh")}
            </button>
          </div>
          {listError ? (
            <p className="px-5 py-6 text-center text-sm text-amber-700">{listError}</p>
          ) : loadingList ? (
            <p className="px-5 py-10 text-center text-sm text-ikea-muted">{t("staffRedeem.loading")}</p>
          ) : bookings.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-ikea-muted">{t("staffRedeem.listEmpty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colBookingNo")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colName")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colPhone")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colVoucher")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colService")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colStore")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colDate")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colTimeSlot")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colStatus")}</th>
                    <th className="px-5 py-3 font-medium">{t("staffRedeem.colCreatedAt")}</th>
                    <th className="px-5 py-3 text-right font-medium">{t("staffRedeem.colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ikea-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-ikea-gray-50">
                      <td className="px-5 py-3 font-mono text-xs font-bold">{booking.bookingNo}</td>
                      <td className="px-5 py-3">{booking.customerName}</td>
                      <td className="px-5 py-3">{booking.phone}</td>
                      <td className="px-5 py-3">{booking.voucherCodes ?? booking.voucherCode}</td>
                      <td className="px-5 py-3">{booking.serviceType}</td>
                      <td className="px-5 py-3">{booking.store}</td>
                      <td className="px-5 py-3">{booking.preferredDate}</td>
                      <td className="px-5 py-3">{booking.timeSlot || "—"}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${statusClassName(booking.status)}`}
                        >
                          {t(statusLabelKey(booking.status))}
                        </span>
                      </td>
                      <td className="px-5 py-3">{formatDate(booking.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        {booking.status === 0 || booking.status === 1 ? (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void doRedeem(booking.bookingNo)}
                            className="rounded bg-ikea-blue px-3 py-1 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {t("staffRedeem.submit")}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
