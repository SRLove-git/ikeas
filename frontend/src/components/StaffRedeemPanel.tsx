"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"
import jsQR from "jsqr"

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
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
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
    setResult(null)
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
            const code = extractCode(decoded.data)
            if (code) {
              setCode(code)
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
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

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

            {scanning ? (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  className="aspect-square w-full rounded border border-ikea-gray-200 bg-black object-cover"
                />
                <button
                  type="button"
                  onClick={stopScanning}
                  className="w-full rounded bg-ikea-gray-200 px-4 py-2 text-sm font-bold hover:bg-ikea-gray-300"
                >
                  {t("staffRedeem.stopScan")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void startScanning()}
                className="h-11 w-full rounded border border-ikea-blue px-4 text-sm font-bold text-ikea-blue hover:bg-ikea-blue/5"
              >
                {t("staffRedeem.scan")}
              </button>
            )}

            {scanError ? (
              <p className="rounded bg-amber-50 px-4 py-3 text-sm text-amber-700">{scanError}</p>
            ) : null}

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
