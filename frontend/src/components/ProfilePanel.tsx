"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useAuth } from "@/lib/auth"
import { CartIcon, CompassIcon, HeartIcon, HomeIcon, TruckIcon } from "@/components/icons"
import { Breadcrumbs } from "@/components/Breadcrumbs"

type ProfileTab = "account" | "password"

function PhoneIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.8537 15.1459c1.7878 1.7878 4.1511 3.0648 5.9849 3.8667 1.227.5365 2.6806.1958 3.7192-.8428l1.1086-1.1087-3.3672-2.2897-.6809.6809c-.4336.4337-1.1097.6959-1.8154.4933-.7847-.2253-2.2164-.7943-3.5855-2.1634-1.3691-1.3691-1.938-2.8008-2.1634-3.5855-.2026-.7057.0596-1.3818.4933-1.8155l.6809-.6808-2.2897-3.3672-1.1087 1.1086C4.7912 6.4804 4.4505 7.934 4.987 9.161c.8019 1.8337 2.0789 4.1971 3.8667 5.9849zm5.1836 5.6991c-1.9323-.8449-4.5553-2.2423-6.5979-4.2849-2.0425-2.0425-3.4399-4.6655-4.2848-6.5978-.9168-2.0965-.2653-4.4084 1.261-5.9347l1.9632-1.9631 1.534.1448L11.3473 7.26l-.1198 1.2694-1.2198 1.2199c.1809.5804.6195 1.6143 1.6239 2.6187s2.0383 1.443 2.6187 1.6239l1.2199-1.2198 1.2694-.1199 5.0507 3.4346.1448 1.534-1.9631 1.9632c-1.5263 1.5263-3.8383 2.1778-5.9347 1.261z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function EmailIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M3.004 4h-1v16h19.9973l.0002-.9998.0024-14L22.0041 4H3.0039zm1 3.2081V18h15.9976l.0019-10.789-7.4216 5.1768-.5718.3988-.572-.3985-7.4342-5.18zM18.2438 6H5.7684l6.2411 4.3486L18.2439 6z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function WeChatIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} aria-hidden="true">
      <path d="M9.5 3C5.91 3 3 5.91 3 9.5c0 1.87.78 3.56 2.05 4.78L4.5 17l2.8-1.18c.68.2 1.41.31 2.2.31h.12a5.45 5.45 0 0 1-.12-1.13c0-3.04 2.46-5.5 5.5-5.5.2 0 .39.01.58.03C14.82 5.74 12.39 3 9.5 3zM7 6.5h5v1H7v-1zm0 2.5h5v1H7V9zm7.5 1.5a4.5 4.5 0 1 0 0 9c.55 0 1.08-.1 1.57-.27l2.38 1-1.06-2.05A4.5 4.5 0 0 0 14.5 10.5zm-1.8 2.4h3v1h-3v-1zm0 2.2h3v1h-3v-1z" />
    </svg>
  )
}

function CustomerServiceIcon({
  size = 24,
  width,
  height,
}: {
  size?: number
  width?: number
  height?: number
}) {
  const iconWidth = width ?? size
  const iconHeight = height ?? size

  return (
    <svg
      viewBox="0 0 24 25"
      fill="currentColor"
      width={iconWidth}
      height={iconHeight}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.61719 17.5201H5.52344C5.64844 17.5201 5.72656 17.4339 5.72656 17.2959V12.1906C5.72656 8.12877 8.53906 5.50712 12.4766 5.50712C16.4141 5.50712 19.2266 8.12877 19.2266 12.1906V17.2959C19.2266 17.4339 19.3047 17.5201 19.4297 17.5201H20.3438C20.6953 17.5201 20.9609 17.2701 20.9609 16.8992V11.7422C20.9609 6.86969 17.4375 3.66162 12.7656 3.66162H12.1875C7.51562 3.66162 4 6.86969 4 11.7422V16.8992C4 17.2701 4.26562 17.5201 4.61719 17.5201ZM7.38281 20.7713H8.46094C9.39062 20.7713 9.96094 20.2022 9.96094 19.219V15.1227C9.96094 14.1396 9.39062 13.5704 8.46094 13.5704H7.38281C6.875 13.5704 6.57031 13.8895 6.57031 14.4501V19.8917C6.57031 20.4523 6.875 20.7713 7.38281 20.7713ZM15 19.219C15 20.2022 15.5703 20.7713 16.5 20.7713H17.5781C18.0938 20.7713 18.4062 20.4523 18.4062 19.8917V14.4501C18.4062 13.8895 18.0938 13.5704 17.5781 13.5704H16.5C15.5703 13.5704 15 14.1396 15 15.1227V19.219Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ProfilePanel() {
  const { t } = useTranslation()
  const { user, ready, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ProfileTab>("account")
  const [accountNotice, setAccountNotice] = useState<string | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [membershipDrawerOpen, setMembershipDrawerOpen] = useState(false)
  const [membershipName, setMembershipName] = useState("")
  const [membershipPhone, setMembershipPhone] = useState("")
  const [membershipEmail, setMembershipEmail] = useState("")
  const [membershipConsent, setMembershipConsent] = useState(false)
  const [membershipNotice, setMembershipNotice] = useState<string | null>(null)

  useEffect(() => {
    if (ready && !user) {
      router.replace("/zh/profile/login/")
    }
  }, [ready, user, router])

  useEffect(() => {
    document.body.style.overflow = membershipDrawerOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [membershipDrawerOpen])

  const submitMembership = () => {
    setMembershipNotice(t("profile.membershipSubmitted"))
    setMembershipDrawerOpen(false)
  }

  if (!ready || !user) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        {t("profile.loading")}
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-white text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel={t("profile.title")} />

        <section className="flex flex-col gap-6 border border-ikea-gray-200 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-ikea-blue text-3xl font-bold text-white">
              {user.name.slice(-1)}
            </span>
            <div>
              <h1 className="text-2xl font-bold leading-9 lg:text-3xl">{user.name}</h1>
              <p className="mt-1 text-sm text-ikea-muted">{user.phone}</p>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    void logout()
                    router.replace("/zh/profile/login/")
                  }}
                  className="font-bold text-ikea-blue hover:underline"
                >
                  {t("profile.logout")}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-px overflow-hidden border border-ikea-gray-200 bg-ikea-gray-200 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: t("profile.orders"),
              desc: t("profile.ordersDesc"),
              href: "/zh/profile/my-orders/",
              icon: CartIcon,
            },
            {
              title: t("profile.coupons"),
              desc: t("profile.couponsDesc"),
              href: "/zh/customer-service/services/privileges/",
              icon: CompassIcon,
            },
            {
              title: t("profile.collection"),
              desc: t("profile.collectionDesc"),
              href: "/zh/profile/collection/",
              icon: HeartIcon,
            },
            {
              title: t("profile.address"),
              desc: t("profile.addressDesc"),
              href: "/zh/profile/address/",
              icon: TruckIcon,
            },
            {
              title: t("profile.browsingHistory"),
              desc: t("profile.browsingHistoryDesc"),
              href: "/zh/profile/browsing-history/",
              icon: HomeIcon,
            },
            {
              title: t("profile.support"),
              desc: t("profile.supportDesc"),
              href: "/zh/customer-service/",
              icon: CustomerServiceIcon,
            },
          ].map(({ title, desc, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="flex items-start gap-4 bg-white p-6 transition-colors hover:bg-ikea-gray-100"
            >
              <span className="mt-0.5 text-ikea-blue">
                <Icon width={24} height={24} />
              </span>
              <span>
                <span className="block text-base font-bold">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-ikea-muted">{desc}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 border-b border-ikea-gray-200">
          {[
            ["account", t("profile.tabAccount")],
            ["password", t("profile.tabPassword")],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key as ProfileTab)
                setAccountNotice(null)
                setPasswordNotice(null)
              }}
              className={`-mb-px border-b-2 px-5 py-3 text-center text-sm font-bold transition-colors ${
                activeTab === key
                  ? "border-ikea-blue text-ikea-black"
                  : "border-transparent text-ikea-muted hover:text-ikea-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "account" ? (
          <>
            <section className="mt-6 border border-ikea-gray-200">
              <div className="divide-y divide-ikea-gray-200">
                <div className="flex items-center justify-between gap-6 p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <span className="text-ikea-blue">
                      <PhoneIcon size={28} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{t("profile.phone")}</p>
                      <p className="mt-1 text-sm text-ikea-muted">
                        {user.phone || t("profile.phoneUnbound")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccountNotice(t("profile.phoneNotice"))}
                    className="text-sm font-bold text-ikea-blue hover:underline"
                  >
                    {t("profile.edit")}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-6 p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <span className="text-ikea-blue">
                      <EmailIcon size={28} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{t("profile.email")}</p>
                      <p className="mt-1 text-sm text-ikea-muted">
                        {user.email || t("profile.emailUnbound")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccountNotice(t("profile.emailNotice"))}
                    className="text-sm font-bold text-ikea-blue hover:underline"
                  >
                    {t("profile.bind")}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-6 p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <span className="text-ikea-blue">
                      <WeChatIcon size={28} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{t("profile.wechat")}</p>
                      <p className="mt-1 text-sm text-ikea-muted">{t("profile.bound")}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAccountNotice(t("profile.wechatNotice"))}
                    className="text-sm font-bold text-ikea-blue hover:underline"
                  >
                    {t("profile.unbind")}
                  </button>
                </div>
              </div>
            </section>

            {accountNotice ? (
              <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-xs text-ikea-muted">
                {accountNotice}
              </p>
            ) : null}

            {membershipNotice ? (
              <p className="mt-4 rounded bg-blue-50 px-4 py-3 text-xs text-ikea-blue">
                {membershipNotice}
              </p>
            ) : null}

            <section className="mt-6 border border-ikea-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-bold">{t("profile.closeAccount")}</h2>
              <p className="mt-2 text-sm text-ikea-muted">{t("profile.closeAccountDesc")}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Link
                  href="/zh/customer-service/"
                  className="border border-ikea-gray-200 p-5 transition-colors hover:border-ikea-black"
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <CustomerServiceIcon size={20} />
                    {t("profile.onlineSupport")}
                  </span>
                  <span className="mt-3 block text-xs leading-5 text-ikea-muted">
                    {t("profile.onlineSupportDesc")}
                  </span>
                  <span className="mt-1 block text-xs text-ikea-muted">
                    {t("profile.supportHours")}
                  </span>
                </Link>
                <a
                  href="tel:+6565189979"
                  className="border border-ikea-gray-200 p-5 transition-colors hover:border-ikea-black"
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <PhoneIcon size={20} />
                    {t("profile.hotline")}
                  </span>
                  <span className="mt-3 block text-xs leading-5 text-ikea-muted">
                    {t("profile.hotlineAuto")}
                  </span>
                  <span className="mt-1 block text-xs text-ikea-muted">
                    {t("profile.hotlineHuman")}
                  </span>
                </a>
              </div>
            </section>

            <section className="mt-6 border border-ikea-gray-200">
              <div className="border-b border-ikea-gray-200 px-6 py-4">
                <h2 className="text-base font-bold">{t("profile.notificationSettings")}</h2>
              </div>
              <div className="divide-y divide-ikea-gray-200">
                <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between md:gap-6 md:p-6">
                  <p className="text-sm font-bold">{t("profile.smsMarketing")}</p>
                  <p className="max-w-xl text-xs leading-5 text-ikea-muted">
                    {t("profile.smsMarketingDesc")}
                    <button
                      type="button"
                      onClick={() => setAccountNotice(t("profile.smsMarketingNotice"))}
                      className="mx-0.5 text-ikea-blue underline underline-offset-2"
                    >
                      {t("profile.clickHere")}
                    </button>
                  </p>
                </div>
                <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between md:gap-6 md:p-6">
                  <p className="text-sm font-bold">{t("profile.emailMarketing")}</p>
                  <p className="max-w-xl text-xs leading-5 text-ikea-muted">
                    {t("profile.emailMarketingDesc")}
                    <button
                      type="button"
                      onClick={() => setAccountNotice(t("profile.emailMarketingNotice"))}
                      className="mx-0.5 text-ikea-blue underline underline-offset-2"
                    >
                      {t("profile.clickHere")}
                    </button>
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 border border-ikea-gray-200">
              <div className="border-b border-ikea-gray-200 px-6 py-4">
                <h2 className="text-base font-bold">{t("profile.privacySettings")}</h2>
              </div>
              <div className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between md:gap-6 md:p-6">
                <p className="text-sm font-bold">{t("profile.personalized")}</p>
                <p className="max-w-xl text-xs leading-5 text-ikea-muted">
                  {t("profile.personalizedDesc")}
                  <button
                    type="button"
                    onClick={() => setAccountNotice(t("profile.personalizedNotice"))}
                    className="mx-0.5 text-ikea-blue underline underline-offset-2"
                  >
                    {t("profile.clickHere")}
                  </button>
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="mt-6 max-w-2xl">
            <div className="border border-ikea-gray-200 p-6 md:p-8">
              <h2 className="text-xl font-bold">{t("profile.changePassword")}</h2>
              <p className="mt-2 text-sm text-ikea-muted">{t("profile.changePasswordHint")}</p>
              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {t("profile.currentPassword")}
                  </span>
                  <input
                    type="password"
                    placeholder={t("profile.currentPasswordPlaceholder")}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">{t("profile.newPassword")}</span>
                  <input
                    type="password"
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">
                    {t("profile.confirmPassword")}
                  </span>
                  <input
                    type="password"
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
                  />
                </label>
              </div>
              {passwordNotice ? (
                <p className="mt-4 rounded bg-ikea-gray-100 px-4 py-3 text-xs text-ikea-muted">
                  {passwordNotice}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setPasswordNotice(t("profile.passwordDemoNotice"))}
                className="relative z-10 mt-6 inline-flex h-11 items-center justify-center rounded-full border border-ikea-gray-200 bg-white px-8 text-sm font-bold text-ikea-black hover:bg-ikea-gray-100"
              >
                {t("profile.saveChanges")}
              </button>
            </div>
          </section>
        )}

        <div className="mt-10 flex justify-end border-t border-ikea-gray-200 pt-6">
          <button
            type="button"
            onClick={() => {
              void logout()
              router.replace("/zh/profile/login/")
            }}
            className="i-btn h-10 border border-ikea-gray-200 px-6 text-sm font-bold text-ikea-black hover:border-ikea-black"
          >
            {t("profile.logout")}
          </button>
        </div>
      </div>

      {membershipDrawerOpen ? (
        <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("common.close")}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMembershipDrawerOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ikea-gray-200 px-6 py-4">
              <h2 className="text-base font-bold">{t("profile.membershipTitle")}</h2>
              <button
                type="button"
                aria-label={t("common.close")}
                className="flex h-8 w-8 items-center justify-center text-ikea-muted hover:text-ikea-black"
                onClick={() => setMembershipDrawerOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="m12 10.6 6-6 1.4 1.4-6 6 6 6-1.4 1.4-6-6-6 6L4.6 18l6-6-6-6L6 4.6z" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm leading-6 text-ikea-muted">{t("profile.membershipIntro")}</p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">{t("profile.name")}</span>
                  <input
                    value={membershipName}
                    onChange={(event) => setMembershipName(event.target.value)}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">{t("profile.phone")}</span>
                  <input
                    value={membershipPhone}
                    onChange={(event) => setMembershipPhone(event.target.value)}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold">{t("profile.email")}</span>
                  <input
                    type="email"
                    value={membershipEmail}
                    onChange={(event) => setMembershipEmail(event.target.value)}
                    className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none focus:border-ikea-blue"
                  />
                </label>
                <label className="flex items-start gap-2 text-xs leading-5 text-ikea-muted">
                  <input
                    type="checkbox"
                    checked={membershipConsent}
                    onChange={(event) => setMembershipConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4"
                  />
                  {t("profile.consent")}
                </label>
              </div>
            </div>

            <div className="border-t border-ikea-gray-200 px-6 py-5">
              <button
                type="button"
                onClick={submitMembership}
                className="i-btn i-btn--primary h-11 w-full text-sm font-bold text-white"
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label">{t("profile.joinNow")}</span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
