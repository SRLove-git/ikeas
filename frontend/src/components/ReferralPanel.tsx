"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GiftIcon } from "@/components/icons"
import { useAuth } from "@/lib/auth"
import { API_BASE, apiJson, getToken, type ReferralSummary } from "@/lib/api"
import { formatPrice } from "@/lib/catalog-format"

interface PointsVoucher {
  id: string
  code: string
  type: number
}

export function ReferralPanel() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, ready } = useAuth()
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pointsVouchers, setPointsVouchers] = useState<PointsVoucher[]>([])
  const [shareNotice, setShareNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace("/zh/profile/login/")
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const data = await apiJson<ReferralSummary>("/referrals/summary")
        if (!cancelled) {
          setSummary(data)
          setError(null)
        }
      } catch (ex) {
        if (!cancelled) {
          setError(ex instanceof Error ? ex.message : t("referral.loadFailed"))
        }
      }
    }
    const loadPointsVouchers = async () => {
      try {
        const vouchers = await apiJson<PointsVoucher[]>("/experience-vouchers/mine")
        if (!cancelled) {
          setPointsVouchers(vouchers.filter((voucher) => voucher.type === 2))
        }
      } catch {
        if (!cancelled) {
          setPointsVouchers([])
        }
      }
    }
    void load()
    void loadPointsVouchers()
    return () => {
      cancelled = true
    }
  }, [ready, user, router, t])

  if (!ready || !user) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("profile.loading")}
      </div>
    )
  }

  const shareUrl = summary ? `/zh/referral/?ref=${encodeURIComponent(summary.code)}` : ""
  const progress =
    summary && summary.referralCount > 0 && summary.progress === 0 ? 5 : (summary?.progress ?? 0)
  const progressPercent = Math.min(100, Math.round((progress / 5) * 100))
  const remaining = summary
    ? Math.max(0, 5 - (summary.progress === 0 && summary.referralCount > 0 ? 5 : summary.progress))
    : 0

  const copyLink = async () => {
    if (!shareUrl) return
    const absoluteShareUrl =
      typeof window === "undefined" ? shareUrl : `${window.location.origin}${shareUrl}`
    try {
      await navigator.clipboard.writeText(absoluteShareUrl)
      setCopied(true)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = absoluteShareUrl
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      textarea.remove()
      setCopied(true)
    }
    window.setTimeout(() => setCopied(false), 2000)
  }

  const downloadPointsPdf = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/experience-vouchers/mine.pdf`, {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      })
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const disposition = response.headers.get("content-disposition") ?? ""
      const match = /filename="?([^"]+)"?/.exec(disposition)
      link.href = url
      link.download = match?.[1] ?? "buzud-points-cards.pdf"
      link.click()
      URL.revokeObjectURL(url)
    } catch (ex) {
      setShareNotice(ex instanceof Error ? ex.message : t("referral.loadFailed"))
    }
  }

  const share = async () => {
    if (!shareUrl) return
    const absoluteShareUrl =
      typeof window === "undefined" ? shareUrl : `${window.location.origin}${shareUrl}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("referral.shareTitle"),
          text: t("referral.shareText"),
          url: absoluteShareUrl,
        })
      } catch {
        // 用户取消分享，无需处理。
      }
      return
    }
    await copyLink()
  }

  const rewardDate = (value: string | null) => {
    if (!value) return ""
    return new Date(value).toLocaleDateString()
  }

  return (
    <div className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("referral.title")} />

        <section className="overflow-hidden rounded-lg border border-ikea-gray-200">
          <div className="bg-ikea-blue px-6 py-8 text-white md:px-10">
            <div className="flex items-start gap-4">
              <span className="mt-1 text-4xl">
                <GiftIcon width={40} height={40} />
              </span>
              <div>
                <h1 className="text-2xl font-bold leading-9">{t("referral.title")}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
                  {t("referral.intro")}
                </p>
              </div>
            </div>
          </div>

          {error ? (
            <p className="border-b border-ikea-gray-200 bg-red-50 px-6 py-4 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          {!summary ? (
            <div className="flex min-h-[220px] items-center justify-center text-sm text-ikea-muted">
              {t("common.loading")}
            </div>
          ) : (
            <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[1fr_360px]">
              <div className="space-y-8">
                <div>
                  <h2 className="text-base font-bold">{t("referral.shareCodeTitle")}</h2>
                  <p className="mt-2 text-sm leading-6 text-ikea-muted">
                    {t("referral.shareCodeHint")}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      readOnly
                      value={shareUrl}
                      onFocus={(event) => event.currentTarget.select()}
                      className="h-12 flex-1 border border-ikea-gray-200 bg-ikea-gray-50 px-4 text-sm text-ikea-muted outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="i-btn i-btn--secondary h-12 shrink-0 px-6 text-sm font-bold text-ikea-black"
                    >
                      {copied ? t("referral.copied") : t("referral.copy")}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="i-btn i-btn--primary mt-3 h-12 w-full px-6 text-sm font-bold text-white sm:w-auto"
                  >
                    {t("referral.shareNow")}
                  </button>
                </div>

                <div>
                  <h2 className="text-base font-bold">{t("referral.rulesTitle")}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-ikea-muted">
                    <p>{t("referral.ruleEvery")}</p>
                    <p>{t("referral.ruleMilestone")}</p>
                    <p>{t("referral.ruleUnique")}</p>
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-lg border border-ikea-gray-200 p-6">
                  <p className="text-sm font-bold">{t("referral.progressTitle")}</p>
                  <p className="mt-2 text-3xl font-bold text-ikea-blue">{summary.referralCount}</p>
                  <p className="mt-1 text-xs text-ikea-muted">{t("referral.invitedCount")}</p>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-ikea-gray-100">
                    <div
                      className="h-full rounded-full bg-ikea-blue transition-all"
                      // 进度条宽度由后端邀请人数动态计算，必须使用内联样式。
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-ikea-muted">
                    {summary.referralCount > 0 && summary.progress === 0
                      ? t("referral.milestoneReached")
                      : t("referral.progressHint", {
                          remaining,
                          nextMilestone: summary.nextMilestone,
                        })}
                  </p>
                </div>

                <div className="rounded-lg border border-ikea-gray-200 p-6">
                  <p className="text-sm font-bold">{t("referral.couponCountTitle")}</p>
                  <p className="mt-2 text-3xl font-bold text-ikea-blue">
                    {summary.issuedCouponCount}
                  </p>
                  <p className="mt-1 text-xs text-ikea-muted">{t("referral.couponCountHint")}</p>
                </div>

                <div className="rounded-lg border border-ikea-gray-200 p-6">
                  <p className="text-sm font-bold">{t("referral.sharePointsTitle")}</p>
                  <p className="mt-2 text-xs leading-5 text-ikea-muted">
                    {t("referral.sharePointsHint")}
                  </p>
                  {pointsVouchers.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      <div className="space-y-2">
                        {pointsVouchers.map((voucher) => (
                          <p
                            key={voucher.id}
                            className="rounded-md border border-ikea-gray-200 bg-ikea-gray-50 px-3 py-2 font-mono text-xs font-bold"
                          >
                            {voucher.code}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs leading-5 text-ikea-muted">
                        {t("referral.sharePointsCount", { count: pointsVouchers.length })}
                      </p>
                      <button
                        type="button"
                        onClick={() => void downloadPointsPdf()}
                        className="i-btn i-btn--secondary h-11 w-full px-4 text-sm font-bold text-ikea-black"
                      >
                        {t("referral.sharePointsDownload")}
                      </button>
                      <Link
                        href="/zh/profile/"
                        className="block text-center text-xs font-bold text-ikea-blue hover:underline"
                      >
                        {t("referral.sharePointsGoVouchers")}
                      </Link>
                    </div>
                  ) : null}
                  {shareNotice ? (
                    <p className="mt-3 text-xs leading-5 text-ikea-blue">{shareNotice}</p>
                  ) : null}
                </div>
              </aside>
            </div>
          )}
        </section>

        {summary && summary.rewards.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-bold">{t("referral.rewardHistory")}</h2>
            <div className="mt-4 overflow-hidden rounded-lg border border-ikea-gray-200">
              <div className="hidden grid-cols-[1fr_160px_180px_120px] gap-4 bg-ikea-gray-50 px-6 py-3 text-xs font-bold text-ikea-muted md:grid">
                <span>{t("referral.colReward")}</span>
                <span>{t("referral.colValue")}</span>
                <span>{t("referral.colInvitee")}</span>
                <span>{t("referral.colTime")}</span>
              </div>
              <div className="divide-y divide-ikea-gray-200">
                {summary.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="grid gap-2 px-6 py-4 text-sm md:grid-cols-[1fr_160px_180px_120px] md:items-center md:gap-4"
                  >
                    <span className="font-bold">{reward.couponName}</span>
                    <span className="text-ikea-blue">{formatPrice(reward.value)}</span>
                    <span className="text-ikea-muted">{reward.inviteeName}</span>
                    <span className="text-xs text-ikea-muted">{rewardDate(reward.earnedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
