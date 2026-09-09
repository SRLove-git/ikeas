"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"
import jsQR from "jsqr"

const SECRET_STORAGE_KEY = "buzud.staff.redeemSecret"

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
  const [secret, setSecret] = useState(() => {
    if (typeof window === "undefined") return ""
    return window.localStorage.getItem(SECRET_STORAGE_KEY) ?? ""
  })
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [redeemedNo, setRedeemedNo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
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
    const params = new URLSearchParams(window.location.search)
    const key = params.get("key")?.trim()
    if (key) {
      setSecret(key)
      window.localStorage.setItem(SECRET_STORAGE_KEY, key)
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const loadBookings = async () => {
    if (!secret.trim()) {
      setListError(t("staffRedeem.missingSecret"))
      return
    }
    setLoadingList(true)
    setListError(null)
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/staff/bookings?secret=${encodeURIComponent(secret.trim())}`,
      )
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

  const doRedeem = async (value: string) => {
    setError(null)
    setRedeemedNo(null)
    if (!secret.trim()) {
      setError(t("staffRedeem.missingSecret"))
      return
    }
    if (!value.trim()) {
      setError(t("staffRedeem.missingCode"))
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim(), code: value.trim() }),
      })
      const body = (await response.json().catch(() => null)) as
        (BookingItem & { message?: string }) | null
      if (!response.ok) {
        throw new Error(body?.message ?? t("staffRedeem.failed"))
      }
      if (body) {
        setRedeemedNo(body.bookingNo)
        window.localStorage.setItem(SECRET_STORAGE_KEY, secret.trim())
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
