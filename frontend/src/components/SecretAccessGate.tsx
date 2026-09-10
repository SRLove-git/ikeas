"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { API_BASE } from "@/lib/api"

const GATE_KEY = "buzud.secretAccessGranted"

export function SecretAccessGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const [granted, setGranted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.sessionStorage.getItem(GATE_KEY) === "1"
  })
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (granted) return <>{children}</>

  const submit = async () => {
    setError(null)
    if (!password.trim()) {
      setError(t("accessGate.missing"))
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE}/api/v1/staff/verify-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      })
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null
      if (!response.ok) {
        throw new Error(body?.message ?? t("accessGate.failed"))
      }
      window.sessionStorage.setItem(GATE_KEY, "1")
      setGranted(true)
    } catch (e) {
      setError((e as Error).message || t("accessGate.failed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="font-ikea flex min-h-screen items-center justify-center bg-ikea-gray-100 px-5 py-10 text-ikea-black">
      <div className="w-full max-w-sm rounded-2xl border border-ikea-gray-200 bg-white p-8 shadow-sm">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ikea-blue text-white">
          🔒
        </span>
        <h1 className="mt-4 text-xl font-bold leading-8">{t("accessGate.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-ikea-muted">{t("accessGate.hint")}</p>
        <label className="mt-6 block text-sm font-bold">
          {t("accessGate.passwordLabel")}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !submitting) void submit()
            }}
            autoFocus
            placeholder={t("accessGate.passwordPlaceholder")}
            className="mt-2 h-11 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
          />
        </label>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="mt-5 flex h-11 w-full items-center justify-center rounded bg-ikea-blue px-4 text-sm font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
        >
          {submitting ? t("accessGate.submitting") : t("accessGate.submit")}
        </button>
      </div>
    </div>
  )
}
