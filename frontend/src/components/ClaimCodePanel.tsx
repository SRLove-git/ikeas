"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"

const TOTAL_SECONDS = 30
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
  const urgent = remaining <= 5

  return (
    <div className="font-ikea flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-blue-50/40 px-5 py-10 text-ikea-black">
      <div className="w-full max-w-md rounded-3xl border border-white bg-white/80 p-8 text-center shadow-xl shadow-blue-900/5 backdrop-blur">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-xl text-white">
          ⏱
        </span>
        <h1 className="mt-4 text-2xl font-bold leading-9">{t("claimCode.title")}</h1>
        <p className="mt-1.5 text-sm leading-6 text-ikea-muted">{t("claimCode.hint")}</p>

        <div className="relative mx-auto mt-8 h-60 w-60">
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0058a3" />
                <stop offset="100%" stopColor="#2b9bd8" />
              </linearGradient>
            </defs>
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              fill="none"
              stroke="#e8edf3"
              strokeWidth="12"
            />
            <circle
              cx="120"
              cy="120"
              r={RADIUS}
              fill="none"
              stroke={urgent ? "#e0524d" : "url(#ring-gradient)"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`text-6xl font-bold tabular-nums leading-none ${
                urgent ? "text-red-500" : "text-ikea-black"
              }`}
            >
              {remaining}
            </span>
            <span className="mt-2 text-xs uppercase tracking-wider text-ikea-muted">
              {t("claimCode.seconds")}
            </span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-5 py-6">
          <p className="text-xs font-bold uppercase tracking-widest text-ikea-muted">
            {t("claimCode.codeLabel")}
          </p>
          {loading && !code ? (
            <p className="mt-3 text-3xl font-bold tracking-[0.35em] text-ikea-muted">
              {t("claimCode.loading")}
            </p>
          ) : (
            <p className="mt-2 select-all font-mono text-5xl font-bold tracking-[0.25em] text-blue-700">
              {code || "------"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
