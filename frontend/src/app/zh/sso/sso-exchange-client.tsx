"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { exchangeSsoCode, setAuthTokens } from "@/lib/api"

function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/zh/profile/"
}

export function SsoExchangeClient({ code, next }: { code: string; next: string }) {
  const [error, setError] = useState<string | null>(() =>
    code ? null : "缺少登录授权码，请重新从 life-sg.com 登录。",
  )
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !code) return
    started.current = true
    exchangeSsoCode(code)
      .then((session) => {
        setAuthTokens(session.token, session.refreshToken ?? null)
        window.location.replace(safeNext(next))
      })
      .catch((ex: unknown) => {
        setError(ex instanceof Error ? ex.message : "登录授权失败，请重新登录。")
      })
  }, [code, next])

  return (
    <main className="font-ikea flex min-h-screen items-center justify-center bg-white px-5 text-center text-ikea-black">
      <div className="w-full max-w-md">
        {error ? (
          <>
            <h1 className="text-xl font-bold">登录未完成</h1>
            <p className="mt-3 text-sm leading-6 text-ikea-muted">{error}</p>
            <Link
              href="/zh/profile/login/"
              className="i-btn i-btn--primary mt-7 inline-flex h-11 items-center justify-center px-7 text-sm"
            >
              重新登录
            </Link>
          </>
        ) : (
          <>
            <span
              className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-ikea-gray-200 border-t-ikea-blue"
              aria-hidden="true"
            />
            <h1 className="mt-5 text-lg font-bold">正在完成统一登录…</h1>
            <p className="mt-2 text-sm text-ikea-muted">请稍候，不会超过几秒钟。</p>
          </>
        )}
      </div>
    </main>
  )
}
