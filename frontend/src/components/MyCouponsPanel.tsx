"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GiftIcon } from "@/components/icons"
import { useAuth } from "@/lib/auth"
import { apiJson } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"

interface CouponView {
  id: string
  code: string
  name: string
  type: number
  value: number
  minAmount: number
  status: number
}

function couponValueText(t: (key: string, opts?: Record<string, unknown>) => string, coupon: CouponView): string {
  if (coupon.type === 2) {
    return t("profile.couponPercentOff", { percent: coupon.value })
  }
  return t("profile.couponFixedOff", { amount: formatPrice(coupon.value) })
}

export function MyCouponsPanel() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, ready } = useAuth()
  const [coupons, setCoupons] = useState<CouponView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ready && !user) {
      router.replace("/zh/profile/login/")
      return
    }
    if (ready && user) {
      let cancelled = false
      void (async () => {
        try {
          const data = await apiJson<CouponView[]>("/marketing/coupons")
          if (!cancelled) setCoupons(data)
        } catch (ex) {
          if (!cancelled) setError(ex instanceof Error ? ex.message : t("profile.couponLoadFailed"))
        }
      })()
      return () => {
        cancelled = true
      }
    }
  }, [ready, user, router, t])

  if (!ready || !user) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("profile.loading")}
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("profile.coupons")} />
        <h1 className="text-2xl font-bold leading-9">{t("profile.coupons")}</h1>

        {error ? (
          <p className="mt-6 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {!coupons ? (
          <div className="mt-6 py-16 text-center text-sm text-ikea-muted">
            {t("profile.loading")}
          </div>
        ) : coupons.length === 0 ? (
          <div className="mt-6 bg-white px-6 py-20 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ikea-gray-100 text-ikea-muted">
              <GiftIcon width={28} height={28} />
            </span>
            <p className="mt-4 text-sm text-ikea-muted">{t("profile.couponEmpty")}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white"
              >
                <div className="flex items-center gap-3 bg-ikea-blue px-5 py-4 text-white">
                  <GiftIcon width={22} height={22} />
                  <p className="min-w-0 flex-1 truncate text-sm font-bold">{coupon.name}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xl font-bold text-ikea-blue">
                    {couponValueText(t, coupon)}
                  </p>
                  <p className="mt-1 text-xs text-ikea-muted">
                    {t("profile.couponMinAmount", { amount: formatPrice(coupon.minAmount) })}
                  </p>
                  <p className="mt-3 border-t border-ikea-gray-100 pt-3 font-mono text-xs font-bold text-ikea-muted">
                    {t("profile.couponCodeLabel")} {coupon.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
