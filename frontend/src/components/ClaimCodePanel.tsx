"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"

const TOTAL_SECONDS = 39
const RADIUS = 96
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ClaimCodePanel() {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [remaining, setRemaining] = useState(TOTAL_SECONDS)
  const [loading, setLoading] = useState(true)
  const loadingRef = useRef(false)

  const loadCode = async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/claim-code`)
      const body = (await response.json().catch(() => null)) as {
        code?: string
        remainingSeconds?: number
        totalSeconds?: number
      } | null
      if (response.ok && body?.code) {
        setCode(body.code)
        setRemaining(body.remainingSeconds ?? TOTAL_SECONDS)
      }
    } catch {
      // 网络异常时保留当前码，等待下一轮重试。
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCode()
    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          void loadCode()
          return TOTAL_SECONDS
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const progress = Math.max(0, Math.min(1, remaining / TOTAL_SECONDS))
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="font-ikea flex min-h-screen items-center justify-center bg-ikea-gray-100 px-5 py-10 text-ikea-black">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold leading-9">{t("claimCode.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-ikea-muted">{t("claimCode.hint")}</p>

        <div className="relative mx-auto mt-8 h-56 w-56">
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="14"
            />
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              fill="none"
              stroke="#0058a3"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums text-ikea-black">{remaining}</span>
            <span className="mt-1 text-xs text-ikea-muted">{t("claimCode.seconds")}</span>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-ikea-gray-300 bg-ikea-gray-50 px-4 py-5">
          <p className="text-xs text-ikea-muted">{t("claimCode.codeLabel")}</p>
          {loading && !code ? (
            <p className="mt-2 text-2xl font-bold tracking-widest text-ikea-muted">
              {t("claimCode.loading")}
            </p>
          ) : (
            <p className="mt-1 font-mono text-4xl font-bold tracking-[0.35em] text-ikea-blue">
              {code || "------"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
