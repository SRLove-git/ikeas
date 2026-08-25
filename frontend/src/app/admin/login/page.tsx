"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { LanguageSwitch } from "@/i18n/LanguageSwitch"
import { adminErrorText, Button, Notice, TextInput } from "@/components/admin/admin-ui"

export default function AdminLoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void fetch("/api/admin/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.user) router.replace("/admin")
      })
      .catch(() => undefined)
  }, [router])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        setError(body?.error ? adminErrorText(body.error) : t("admin.login.loginFailed"))
        return
      }
      router.replace("/admin")
    } catch {
      setError(t("admin.login.cannotConnect"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-blue-950 px-4">
      <div className="absolute right-5 top-5 flex items-center gap-1 text-xs text-white/70">
        <LanguageSwitch className="text-white/70" />
      </div>
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ikea-blue text-lg font-black text-white">
            {t("admin.login.logo")}
          </div>
          <h1 className="text-lg font-bold text-ikea-black">{t("admin.shell.brand")}</h1>
          <p className="mt-1 text-xs text-ikea-muted">{t("admin.login.subtitle")}</p>
        </div>
        {error ? (
          <div className="mb-4">
            <Notice kind="error">{error}</Notice>
          </div>
        ) : null}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ikea-black">
              {t("admin.login.username")}
            </label>
            <TextInput
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ikea-black">
              {t("admin.login.password")}
            </label>
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="admin123"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? t("admin.login.loggingIn") : t("admin.login.login")}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-ikea-muted">
          {t("admin.login.demoHint")}
        </p>
      </div>
    </div>
  )
}
