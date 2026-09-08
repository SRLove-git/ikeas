"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth"
import { apiJson } from "@/lib/api"
import { clearReferralCode, getReferralCode } from "@/lib/referral"

type AuthMode = "login" | "register" | "forgotPassword"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SG_PHONE = /^[89]\d{7}$/

export default function LoginPage() {
  const { t } = useTranslation()
  const modes: [AuthMode, string][] = [
    ["login", t("login.tabLogin")],
    ["register", t("login.tabRegister")],
    ["forgotPassword", t("login.tabForgotPassword")],
  ]
  const [mode, setMode] = useState<AuthMode>("login")
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [verificationEmail, setVerificationEmail] = useState("")
  const [emailCode, setEmailCode] = useState("")
  const [codeSending, setCodeSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login, register } = useAuth()
  const router = useRouter()

  const recipientEmail = EMAIL.test(account.trim()) ? account.trim() : verificationEmail.trim()

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((current) => current - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const validateAccount = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) {
      return t("login.enterAccount")
    }
    if (SG_PHONE.test(trimmed)) {
      return t("login.phoneNotSupported")
    }
    if (trimmed.includes("@") && !EMAIL.test(trimmed)) {
      return t("login.invalidEmail")
    }
    return null
  }

  const sendCode = async () => {
    setError(null)
    setNotice(null)

    const accountError = validateAccount(account)
    if (accountError) {
      setError(accountError)
      return
    }
    if (!EMAIL.test(recipientEmail)) {
      setError(t("login.enterVerificationEmail"))
      return
    }

    setCodeSending(true)
    try {
      const data = await apiJson<{ message: string; devCode?: string }>("/auth/email/send", {
        method: "POST",
        body: JSON.stringify({ email: recipientEmail }),
      })
      setNotice(data.devCode ? `${data.message}（开发验证码：${data.devCode}）` : data.message)
      setCountdown(60)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("login.emailSendFailed"))
    } finally {
      setCodeSending(false)
    }
  }

  const submit = async () => {
    if (!agreed) {
      setError(t("login.needAgree"))
      return
    }

    setError(null)
    setSubmitting(true)
    const referralCode = getReferralCode() ?? undefined

    try {
      const accountError = validateAccount(account)
      if (accountError) {
        setError(accountError)
        return
      }
      if (!password) {
        setError(t("login.enterPassword"))
        return
      }
      if (mode === "register") {
        if (!EMAIL.test(recipientEmail)) {
          setError(t("login.enterVerificationEmail"))
          return
        }
        if (!emailCode.trim()) {
          setError(t("login.enterEmailCode"))
          return
        }
        if (password.length < 6) {
          setError(t("login.passwordTooShort"))
          return
        }
        if (password !== confirmPassword) {
          setError(t("login.passwordMismatch"))
          return
        }
        await register({
          account: account.trim(),
          password,
          email: recipientEmail,
          emailCode: emailCode.trim(),
          name: name.trim() || undefined,
          referralCode,
        })
      } else {
        await login({
          account: account.trim(),
          password,
          referralCode,
        })
      }

      clearReferralCode()
      setSubmitted(true)
      setTimeout(() => router.replace("/zh/profile/"), 500)
    } catch (ex) {
      setError(
        ex instanceof Error
          ? ex.message
          : mode === "register"
            ? t("login.registerFailed")
            : t("login.loginFailed"),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const resetPassword = async () => {
    const email = account.trim()
    if (!EMAIL.test(email)) {
      setError(t("login.enterVerificationEmail"))
      return
    }
    if (!emailCode.trim()) {
      setError(t("login.enterEmailCode"))
      return
    }
    if (password.length < 6) {
      setError(t("login.passwordTooShort"))
      return
    }

    setError(null)
    setNotice(null)
    setSubmitting(true)
    try {
      await apiJson("/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ email, emailCode: emailCode.trim(), newPassword: password }),
      })
      setNotice(t("login.resetSuccess"))
      setMode("login")
      setAccount("")
      setPassword("")
      setEmailCode("")
      setCountdown(0)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("login.resetFailed"))
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
          <Link href="/zh/customer-service/contact-us/" className="text-ikea-blue hover:underline">
            {t("login.customerService")}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <h1 className="text-center text-2xl font-bold leading-9">{t("login.welcome")}</h1>

          <div className="mt-8 flex gap-1 border-b border-ikea-gray-200">
            {modes.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key)
                  setError(null)
                  setNotice(null)
                  setSubmitted(false)
                }}
                className={`-mb-px border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
                  mode === key
                    ? "border-ikea-blue text-ikea-black"
                    : "border-transparent text-ikea-muted hover:text-ikea-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">
                {mode === "forgotPassword" ? t("login.resetEmailLabel") : t("login.accountLabel")}
              </span>
              <input
                type="text"
                autoComplete={mode === "forgotPassword" ? "email" : "username"}
                placeholder={
                  mode === "forgotPassword"
                    ? t("login.resetEmailPlaceholder")
                    : t("login.accountPlaceholder")
                }
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
              />
            </label>

            {mode === "register" || mode === "forgotPassword" ? (
              <>
                {mode === "register" && !EMAIL.test(account.trim()) ? (
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold">
                      {t("login.verificationEmailLabel")}
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder={t("login.verificationEmailPlaceholder")}
                      value={verificationEmail}
                      onChange={(event) => setVerificationEmail(event.target.value)}
                      className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                    />
                  </label>
                ) : null}
                <div className="flex gap-3">
                  <label className="block flex-1">
                    <span className="mb-1.5 block text-sm font-bold">
                      {t("login.emailCodeLabel")}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder={t("login.emailCodePlaceholder")}
                      value={emailCode}
                      onChange={(event) => setEmailCode(event.target.value)}
                      className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={codeSending || submitting || countdown > 0}
                    onClick={() => void sendCode()}
                    className="mt-[26px] h-11 shrink-0 border border-ikea-gray-200 px-5 text-xs font-bold text-ikea-blue hover:border-ikea-blue disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {codeSending
                      ? t("login.emailCodeSending")
                      : countdown > 0
                        ? t("login.emailCodeCountdown", { countdown })
                        : t("login.getEmailCode")}
                  </button>
                </div>
              </>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">
                {mode === "forgotPassword" ? t("login.newPasswordLabel") : t("login.passwordLabel")}
              </span>
              <input
                type="password"
                autoComplete={
                  mode === "register" || mode === "forgotPassword"
                    ? "new-password"
                    : "current-password"
                }
                placeholder={
                  mode === "forgotPassword"
                    ? t("login.newPasswordPlaceholder")
                    : t("login.passwordPlaceholder")
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
              />
            </label>

            {mode === "register" ? (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {t("login.confirmPasswordLabel")}
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("login.confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void submit()
                      }
                    }}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {t("login.nameLabel")}
                    <span className="ml-1 font-normal text-ikea-muted">{t("login.optional")}</span>
                  </span>
                  <input
                    type="text"
                    autoComplete="nickname"
                    placeholder={t("login.namePlaceholder")}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
              </>
            ) : null}

            {mode !== "forgotPassword" ? (
              <label className="mt-6 flex cursor-pointer items-start gap-2 text-xs leading-5 text-ikea-muted">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-ikea-blue"
                />
                <span>
                  {t("login.agreePrefix")}
                  <Link href="/zh/privacy-policy/" className="mx-0.5 text-ikea-blue hover:underline">
                    {t("login.privacyPolicy")}
                  </Link>
                  {t("login.and")}
                  <Link
                    href="/zh/conditions-of-use/"
                    className="mx-0.5 text-ikea-blue hover:underline"
                  >
                    {t("login.termsOfUse")}
                  </Link>
                </span>
              </label>
            ) : null}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void (mode === "forgotPassword" ? resetPassword() : submit())}
              className="i-btn i-btn--primary mt-6 h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="i-btn__inner">
                <span className="i-btn__label">
                  {submitting
                    ? t("common.loading")
                    : mode === "register"
                      ? t("login.submitRegister")
                      : mode === "forgotPassword"
                        ? t("login.submitReset")
                        : t("login.submit")}
                </span>
              </span>
            </button>

            {mode === "login" ? (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgotPassword")
                    setError(null)
                    setNotice(null)
                    setEmailCode("")
                    setPassword("")
                    setCountdown(0)
                  }}
                  className="mt-4 text-xs text-ikea-blue hover:underline"
                >
                  {t("login.forgotPassword")}
                </button>
              </div>
            ) : null}

            {submitted ? (
              <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-center text-xs text-ikea-muted">
                {mode === "register" ? t("login.registerSuccess") : t("login.success")}
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
