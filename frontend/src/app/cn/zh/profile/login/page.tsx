"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth"
import { apiJson } from "@/lib/api"

type LoginTab = "sms" | "email" | "username"

export default function LoginPage() {
  const { t } = useTranslation()
  const tabs: [LoginTab, string][] = [
    ["sms", t("login.tabSms")],
    ["email", t("login.tabEmail")],
    ["username", t("login.tabUsername")],
  ]
  const [tab, setTab] = useState<LoginTab>("sms")
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const sendCode = async () => {
    setError(null)
    setNotice(null)

    if (!/^1\d{10}$/.test(phone.trim())) {
      setError(t("login.invalidPhone"))
      return
    }

    try {
      const data = await apiJson<{ message: string }>("/auth/sms/send", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim() }),
      })
      setNotice(data.message)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("login.codeSendFailed"))
    }
  }

  const submit = async () => {
    if (!agreed) {
      setError(t("login.needAgree"))
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      if (tab === "sms") {
        if (!/^1\d{10}$/.test(phone.trim())) {
          setError(t("login.invalidPhone"))
          return
        }
        if (!code.trim()) {
          setError(t("login.enterCode"))
          return
        }
        await login({ mode: "sms", phone: phone.trim(), code: code.trim() })
      } else if (tab === "email") {
        if (!email.trim()) {
          setError(t("login.enterEmail"))
          return
        }
        if (!password) {
          setError(t("login.enterPassword"))
          return
        }
        await login({ mode: "password", account: email.trim(), password })
      } else {
        if (!username.trim()) {
          setError(t("login.enterUsername"))
          return
        }
        if (!password) {
          setError(t("login.enterPassword"))
          return
        }
        await login({ mode: "password", account: username.trim(), password })
      }

      setSubmitted(true)
      setTimeout(() => router.replace("/cn/zh/profile/"), 500)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("login.loginFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="font-ikea flex min-h-screen flex-col bg-white text-ikea-black">
      <header className="flex h-16 items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-wide">
            CHUNG YIP<span className="text-ikea-blue">·</span>
            {t("login.brand")}
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold">CHUNG YIP</span>
          <span className="hidden text-ikea-muted md:inline">{t("login.brandTagline")}</span>
          <Link
            href="/cn/zh/customer-service/contact-us/"
            className="text-ikea-blue hover:underline"
          >
            {t("login.customerService")}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <h1 className="text-center text-2xl font-bold leading-9">{t("login.welcome")}</h1>

          <div className="mt-8 flex gap-1 border-b border-ikea-gray-200">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key)
                  setError(null)
                  setNotice(null)
                }}
                className={`-mb-px border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
                  tab === key
                    ? "border-ikea-blue text-ikea-black"
                    : "border-transparent text-ikea-muted hover:text-ikea-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {tab === "sms" ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">{t("login.phoneLabel")}</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder={t("login.phonePlaceholder")}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <div className="flex gap-3">
                  <label className="block flex-1">
                    <span className="mb-1.5 block text-sm font-bold">{t("login.codeLabel")}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={t("login.codePlaceholder")}
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={sendCode}
                    className="mt-[26px] h-11 shrink-0 border border-ikea-gray-200 px-5 text-xs font-bold text-ikea-blue hover:border-ikea-blue"
                  >
                    {t("login.getCode")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {tab === "email" ? t("login.emailLabel") : t("login.usernameLabel")}
                  </span>
                  <input
                    type={tab === "email" ? "email" : "text"}
                    placeholder={
                      tab === "email" ? t("login.enterEmail") : t("login.enterUsername")
                    }
                    value={tab === "email" ? email : username}
                    onChange={(event) => {
                      if (tab === "email") {
                        setEmail(event.target.value)
                      } else {
                        setUsername(event.target.value)
                      }
                    }}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {t("login.passwordLabel")}
                  </span>
                  <input
                    type="password"
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void submit()
                      }
                    }}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
              </div>
            )}

            <label className="mt-6 flex cursor-pointer items-start gap-2 text-xs leading-5 text-ikea-muted">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-ikea-blue"
              />
              <span>
                {t("login.agreePrefix")}
                <Link
                  href="/cn/zh/customer-service/privacy-policy/"
                  className="mx-0.5 text-ikea-blue hover:underline"
                >
                  {t("login.privacyPolicy")}
                </Link>
                {t("login.and")}
                <Link
                  href="/cn/zh/customer-service/terms-conditions/"
                  className="mx-0.5 text-ikea-blue hover:underline"
                >
                  {t("login.termsOfUse")}
                </Link>
              </span>
            </label>

            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="i-btn i-btn--primary mt-6 h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="i-btn__inner">
                <span className="i-btn__label">
                  {submitting
                    ? t("common.loading")
                    : tab === "sms"
                      ? t("login.submitSms")
                      : t("login.submit")}
                </span>
              </span>
            </button>

            {submitted ? (
              <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-center text-xs text-ikea-muted">
                {t("login.success")}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded bg-red-50 px-4 py-3 text-center text-xs text-red-600">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-center text-xs text-ikea-muted">
                {notice}
              </p>
            ) : null}

          </div>
        </div>
      </div>

      <footer className="border-t border-ikea-gray-200 py-6 text-center text-xs text-ikea-muted">
        © CHUNG YIP HOLDING PTE. LTD. All Rights Reserved.
      </footer>
    </main>
  )
}
