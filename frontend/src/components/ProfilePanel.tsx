"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

export function ProfilePanel() {
  const { user, ready, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) {
      router.replace("/cn/zh/profile/login/")
    }
  }, [ready, user, router])

  if (!ready || !user) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        加载中…
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <nav className="mb-6 flex items-center gap-2 text-sm text-ikea-muted">
          <Link href="/" className="hover:text-ikea-black">
            首页
          </Link>
          <span>/</span>
          <span className="text-ikea-black">我的个人档案</span>
        </nav>

        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ikea-blue text-2xl font-bold text-white">
            {user.name.slice(-1)}
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-9">{user.name}</h1>
            <p className="mt-1 text-sm text-ikea-muted">{user.phone}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["我的订单", "查看历史订单", "/cn/zh/profile/my-orders/"],
            ["我的收藏", "喜欢的商品", "/cn/zh/wishlist/"],
            [
              "BUZUD 会员权益",
              "尊享优惠与健康体验",
              "/cn/zh/customer-service/services/privileges/",
            ],
            ["商品对比", "比较心仪商品", "/cn/zh/compare/"],
          ].map(([title, desc, href]) => (
            <Link
              key={title}
              href={href}
              className="border border-ikea-gray-200 p-6 transition-colors hover:border-ikea-black"
            >
              <h2 className="text-base font-bold">{title}</h2>
              <p className="mt-1 text-xs text-ikea-muted">{desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 border-t border-ikea-gray-200 pt-6">
          <button
            type="button"
            onClick={() => {
              void logout()
              router.replace("/cn/zh/profile/login/")
            }}
            className="i-btn h-10 border border-ikea-gray-200 px-6 text-sm font-bold hover:border-ikea-black"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}
