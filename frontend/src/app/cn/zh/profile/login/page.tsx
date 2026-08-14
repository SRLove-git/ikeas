"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { apiJson } from "@/lib/api"

type LoginTab = "sms" | "email" | "username"

const tabs: [LoginTab, string][] = [
  ["sms", "短信登录"],
  ["email", "邮箱登录"],
  ["username", "用户名登录"],
]

export default function LoginPage() {
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
      setError("请输入正确的 11 位手机号")
      return
    }

    try {
      const data = await apiJson<{ message: string; devCode?: string }>("/auth/sms/send", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim() }),
      })
      setNotice(data.devCode ? `${data.message}（演示环境验证码：${data.devCode}）` : data.message)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "验证码发送失败")
    }
  }

  const submit = async () => {
    if (!agreed) {
      setError("请先阅读并同意隐私政策和使用条款")
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      if (tab === "sms") {
        if (!/^1\d{10}$/.test(phone.trim())) {
          setError("请输入正确的 11 位手机号")
          return
        }
        if (!code.trim()) {
          setError("请输入验证码")
          return
        }
        await login({ mode: "sms", phone: phone.trim(), code: code.trim() })
      } else if (tab === "email") {
        if (!email.trim()) {
          setError("请输入邮箱")
          return
        }
        if (!password) {
          setError("请输入密码")
          return
        }
        await login({ mode: "password", account: email.trim(), password })
      } else {
        if (!username.trim()) {
          setError("请输入用户名")
          return
        }
        if (!password) {
          setError("请输入密码")
          return
        }
        await login({ mode: "password", account: username.trim(), password })
      }

      setSubmitted(true)
      setTimeout(() => router.replace("/cn/zh/profile/"), 500)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "登录失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="font-ikea flex min-h-screen flex-col bg-white text-ikea-black">
      <header className="flex h-16 items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-wide">
            BUZUD<span className="text-ikea-blue">·</span>健康产品商城
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold">BUZUD</span>
          <span className="hidden text-ikea-muted md:inline">重新定义医疗健康，智能守护每一天</span>
          <Link
            href="/cn/zh/customer-service/contact-us/"
            className="text-ikea-blue hover:underline"
          >
            客服
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <h1 className="text-center text-2xl font-bold leading-9">欢迎来到 BUZUD</h1>

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
                  <span className="mb-1.5 block text-sm font-bold">手机号</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <div className="flex gap-3">
                  <label className="block flex-1">
                    <span className="mb-1.5 block text-sm font-bold">验证码</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="验证码"
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
                    获取验证码
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {tab === "email" ? "邮箱" : "用户名"}
                  </span>
                  <input
                    type={tab === "email" ? "email" : "text"}
                    placeholder={tab === "email" ? "请输入邮箱" : "请输入用户名"}
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
                  <span className="mb-1.5 block text-sm font-bold">密码</span>
                  <input
                    type="password"
                    placeholder="密码"
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
                我已阅读并同意
                <Link
                  href="/cn/zh/customer-service/privacy-policy/"
                  className="mx-0.5 text-ikea-blue hover:underline"
                >
                  隐私政策
                </Link>
                和
                <Link
                  href="/cn/zh/customer-service/terms-conditions/"
                  className="mx-0.5 text-ikea-blue hover:underline"
                >
                  使用条款
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
                  {submitting ? "请稍候…" : tab === "sms" ? "登录 / 注册" : "登录"}
                </span>
              </span>
            </button>

            {submitted ? (
              <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-center text-xs text-ikea-muted">
                登录成功，正在进入我的个人档案…
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

            <p className="mt-3 text-center text-xs text-ikea-muted">
              演示账号：demo@ikea.cn（或 13800138000），密码 123456
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-ikea-gray-200 py-6 text-center text-xs text-ikea-muted">
        © BUZUD PTE. LTD. All Rights Reserved.
      </footer>
    </main>
  )
}
