"use client";

import { useState } from "react";
import Link from "next/link";

type LoginTab = "sms" | "password";

export default function LoginPage() {
  const [tab, setTab] = useState<LoginTab>("sms");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="font-ikea flex min-h-screen flex-col bg-white text-ikea-black">
      {/* top bar */}
      <header className="flex h-16 items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-ikea-blue">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-ikea-yellow">
              <rect x="3" y="3" width="18" height="18" fill="currentColor" />
              <path d="M12 6v12M6 12h12" stroke="#0058a3" strokeWidth="2.4" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-wide">
            IKEA<span className="text-ikea-blue">·</span>宜家
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <span className="font-bold">Hej!</span>
          <span className="hidden text-ikea-muted md:inline">
            为大众创造更美好的日常生活
          </span>
          <Link href="/cn/zh/customer-service/contact-us/" className="text-ikea-blue hover:underline">
            客服
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[440px]">
          <h1 className="text-center text-2xl font-bold leading-9">
            欢迎来到 宜家
          </h1>

          {/* tabs */}
          <div className="mt-8 flex gap-1 border-b border-ikea-gray-200">
            {(
              [
                ["sms", "验证码登录"],
                ["password", "账户密码登录"],
              ] as [LoginTab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
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
                    type="text"
                    placeholder="请输入手机号"
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <div className="flex gap-3">
                  <label className="block flex-1">
                    <span className="mb-1.5 block text-sm font-bold">验证码</span>
                    <input
                      type="text"
                      placeholder="验证码"
                      className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                    />
                  </label>
                  <button
                    type="button"
                    className="mt-[26px] h-11 shrink-0 border border-ikea-gray-200 px-5 text-xs font-bold text-ikea-blue hover:border-ikea-blue"
                  >
                    获取验证码
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">邮箱/手机号</span>
                  <input
                    type="text"
                    placeholder="邮箱/手机号"
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">密码</span>
                  <input
                    type="password"
                    placeholder="密码"
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <div className="text-right">
                  <a href="#" className="text-xs text-ikea-blue hover:underline">
                    忘记密码?
                  </a>
                </div>
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
              disabled={!agreed}
              onClick={() => setSubmitted(true)}
              className="i-btn i-btn--primary mt-6 h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="i-btn__label">{tab === "sms" ? "登录 / 注册" : "登录"}</span>
            </button>

            {submitted ? (
              <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-center text-xs text-ikea-muted">
                演示环境:登录功能待接入后端后开放
              </p>
            ) : null}

            <div className="mt-8">
              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-ikea-gray-200" />
                <span className="text-xs text-ikea-muted">其他登录方式</span>
                <span className="h-px flex-1 bg-ikea-gray-200" />
              </div>
              <button
                type="button"
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 border border-ikea-gray-200 text-sm font-bold hover:border-ikea-black"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#07c160]">
                  <path
                    fill="currentColor"
                    d="M8.7 10.6c-.3 0-.5.2-.5.5v2.2c0 .3.2.5.5.5h1.5l1.5 1.6v-1.6h.3c.8 0 1.4-.4 1.6-1 .1-.3.2-.6.2-.9v-.8c0-.3-.2-.5-.5-.5H8.7zm4.8-1.6h1.5c.3 0 .5-.2.5-.5V6.3c0-.3-.2-.5-.5-.5h-2.2c-.3 0-.5.2-.5.5v1.8c0 .3.2.5.5.5h.7zm-3.5 3.4v-.8c0-.3-.2-.5-.5-.5H7.3c-.3 0-.5.2-.5.5v.8c0 .3.2.5.5.5h2.2c.3 0 .5-.2.5-.5zM12 3a9 9 0 0 0-9 9c0 1.7.5 3.3 1.3 4.7L3.5 21l4.4-1.2c1.3.7 2.7 1.1 4.1 1.1a9 9 0 1 0 0-18zm4.7 9.6c-.4.9-1.1 1.6-2 2.1-.6.3-1.3.5-2 .5h-3.2l-3.4 3.6 1-3.3C4.6 14.2 4 12.7 4 11.2 4 7.4 7.6 4.5 12 4.5s8 2.9 8 6.7c0 1.5-.5 2.9-1.3 4.1z"
                  />
                </svg>
                微信登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-ikea-gray-200 py-6 text-center text-xs text-ikea-muted">
        © Inter IKEA Systems B.V. 1999-2026
      </footer>
    </main>
  );
}
