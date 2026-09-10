"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocale } from "@/i18n/LanguageProvider"
import {
  adminFetch,
  Button,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui"

interface Booking {
  id: string
  bookingNo: string
  customerName: string
  phone: string
  email: string
  voucherCode: string
  voucherCodes?: string | null
  serviceType: string
  store: string
  preferredDate: string
  timeSlot?: string | null
  note?: string | null
  status: number
  createdAt: string
  updatedAt: string
}

interface DailyLimitConfig {
  default?: number
  overrides?: Record<string, number>
}

function statusLabelKey(status: number): string {
  if (status === 1) return "admin.bookings.statusConfirmed"
  if (status === 2) return "admin.bookings.statusCompleted"
  if (status === 3) return "admin.bookings.statusCancelled"
  return "admin.bookings.statusPending"
}

function statusClassName(status: number): string {
  if (status === 1) return "bg-blue-100 text-blue-700"
  if (status === 2) return "bg-green-100 text-green-700"
  if (status === 3) return "bg-ikea-gray-100 text-ikea-muted"
  return "bg-amber-100 text-amber-700"
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale === "en" ? "en-SG" : "zh-CN", { hour12: false })
}

export default function BookingsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [redeemCode, setRedeemCode] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [redeemNotice, setRedeemNotice] = useState<string | null>(null)
  const [dailyLimit, setDailyLimit] = useState("")
  const [overrideDate, setOverrideDate] = useState("")
  const [overrideLimit, setOverrideLimit] = useState("")
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [savingLimit, setSavingLimit] = useState(false)
  const [limitNotice, setLimitNotice] = useState<string | null>(null)

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (statusFilter) params.set("status", statusFilter)
      const suffix = params.toString() ? `?${params.toString()}` : ""
      const data = await adminFetch<Booking[]>(`/api/admin/server/bookings${suffix}`)
      setBookings(data)
      setError(null)
    } catch (e) {
      setError(`${t("admin.bookings.loadFailed")}：${(e as Error).message}`)
    }
  }

  const loadDailyLimit = async () => {
    try {
      const data = await adminFetch<DailyLimitConfig>(
        "/api/admin/server/bookings/daily-limit",
      )
      setDailyLimit(String(data.default ?? 6))
      setOverrides(data.overrides ?? {})
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const applyLimitConfig = (data: DailyLimitConfig) => {
    setDailyLimit(String(data.default ?? 6))
    setOverrides(data.overrides ?? {})
  }

  const saveDefaultLimit = async () => {
    const value = Number(dailyLimit)
    if (!Number.isInteger(value) || value <= 0) {
      setLimitNotice(t("admin.bookings.dailyLimitInvalid"))
      return
    }
    setSavingLimit(true)
    setLimitNotice(null)
    try {
      const data = await adminFetch<DailyLimitConfig>(
        "/api/admin/server/bookings/daily-limit",
        {
          method: "PUT",
          body: JSON.stringify({ limit: value }),
        },
      )
      applyLimitConfig(data)
      setLimitNotice(t("admin.bookings.dailyLimitSaved"))
    } catch (e) {
      setLimitNotice((e as Error).message)
    } finally {
      setSavingLimit(false)
    }
  }

  const saveOverrideLimit = async () => {
    if (!overrideDate) {
      setLimitNotice(t("admin.bookings.dailyLimitDateEmpty"))
      return
    }
    const value = Number(overrideLimit)
    if (!Number.isInteger(value) || value <= 0) {
      setLimitNotice(t("admin.bookings.dailyLimitInvalid"))
      return
    }
    setSavingLimit(true)
    setLimitNotice(null)
    try {
      const data = await adminFetch<DailyLimitConfig>(
        `/api/admin/server/bookings/daily-limit/${overrideDate}`,
        {
          method: "PUT",
          body: JSON.stringify({ limit: value }),
        },
      )
      applyLimitConfig(data)
      setOverrideDate("")
      setOverrideLimit("")
      setLimitNotice(t("admin.bookings.dailyLimitSaved"))
    } catch (e) {
      setLimitNotice((e as Error).message)
    } finally {
      setSavingLimit(false)
    }
  }

  const deleteOverride = async (date: string) => {
    setSavingLimit(true)
    setLimitNotice(null)
    try {
      const data = await adminFetch<DailyLimitConfig>(
        `/api/admin/server/bookings/daily-limit/${date}`,
        { method: "DELETE" },
      )
      applyLimitConfig(data)
    } catch (e) {
      setLimitNotice((e as Error).message)
    } finally {
      setSavingLimit(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await adminFetch<Booking[]>("/api/admin/server/bookings")
        if (!cancelled) {
          setBookings(data)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadDailyLimit()
  }, [])

  const updateStatus = async (booking: Booking, status: number) => {
    try {
      await adminFetch(`/api/admin/server/bookings/${booking.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const deleteBooking = async (booking: Booking) => {
    if (!window.confirm(t("admin.bookings.confirmDelete"))) return
    try {
      await adminFetch(`/api/admin/server/bookings/${booking.id}`, {
        method: "DELETE",
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const redeem = async () => {
    if (!redeemCode.trim()) {
      setRedeemNotice(t("admin.bookings.redeemEmpty"))
      return
    }
    setRedeeming(true)
    setRedeemNotice(null)
    setError(null)
    try {
      const booking = await adminFetch<Booking>("/api/admin/server/bookings/redeem", {
        method: "POST",
        body: JSON.stringify({ code: redeemCode.trim() }),
      })
      setRedeemNotice(t("admin.bookings.redeemSuccess", { no: booking.bookingNo }))
      setRedeemCode("")
      await load()
    } catch (e) {
      setRedeemNotice((e as Error).message)
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <div>
      <PageHeader title={t("admin.bookings.title")} description={t("admin.bookings.desc")} />

      {error ? <Notice kind="error">{error}</Notice> : null}

      <section className="mt-6 rounded-lg border border-ikea-gray-200 bg-white p-5">
        <h2 className="text-base font-bold">{t("admin.bookings.dailyLimitTitle")}</h2>
        <p className="mt-1 text-xs leading-5 text-ikea-muted">{t("admin.bookings.dailyLimitHint")}</p>

        <div className="mt-4 border-b border-ikea-gray-100 pb-4">
          <p className="text-xs font-bold text-ikea-muted">{t("admin.bookings.dailyLimitDefaultLabel")}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <input
              type="number"
              min={1}
              value={dailyLimit}
              onChange={(event) => setDailyLimit(event.target.value)}
              placeholder={t("admin.bookings.dailyLimitPlaceholder")}
              className="h-10 w-full rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue sm:max-w-xs"
            />
            <Button onClick={() => void saveDefaultLimit()} disabled={savingLimit}>
              {savingLimit ? t("admin.common.saving") : t("admin.bookings.dailyLimitSave")}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold text-ikea-muted">{t("admin.bookings.dailyLimitDateLabel")}</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <input
              type="date"
              value={overrideDate}
              onChange={(event) => setOverrideDate(event.target.value)}
              className="h-10 rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
            />
            <input
              type="number"
              min={1}
              value={overrideLimit}
              onChange={(event) => setOverrideLimit(event.target.value)}
              placeholder={t("admin.bookings.dailyLimitPlaceholder")}
              className="h-10 w-full rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue sm:max-w-xs"
            />
            <Button onClick={() => void saveOverrideLimit()} disabled={savingLimit}>
              {t("admin.bookings.dailyLimitDateSave")}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold text-ikea-muted">{t("admin.bookings.dailyLimitOverridesTitle")}</p>
          {Object.keys(overrides).length === 0 ? (
            <p className="mt-2 text-sm text-ikea-muted">{t("admin.bookings.dailyLimitNoOverrides")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-ikea-gray-100 rounded-md border border-ikea-gray-100">
              {Object.entries(overrides)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, limit]) => (
                  <li
                    key={date}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{date}</span>
                    <span className="font-bold text-ikea-blue">{limit}</span>
                    <Button variant="danger" onClick={() => void deleteOverride(date)}>
                      {t("admin.bookings.dailyLimitDateDelete")}
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {limitNotice ? (
          <p className="mt-3 text-sm text-ikea-blue">{limitNotice}</p>
        ) : null}
      </section>

      <section className="mt-6 rounded-lg border border-ikea-blue/20 bg-ikea-blue/5 p-5">
        <h2 className="text-base font-bold">{t("admin.bookings.redeemTitle")}</h2>
        <p className="mt-1 text-xs leading-5 text-ikea-muted">{t("admin.bookings.redeemHint")}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={redeemCode}
            onChange={(event) => setRedeemCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !redeeming) void redeem()
            }}
            placeholder={t("admin.bookings.redeemPlaceholder")}
            className="h-10 flex-1 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
          />
          <Button onClick={() => void redeem()} disabled={redeeming}>
            {redeeming ? t("admin.bookings.redeeming") : t("admin.bookings.redeem")}
          </Button>
        </div>
        {redeemNotice ? (
          <p className="mt-3 text-sm text-ikea-blue">{redeemNotice}</p>
        ) : null}
      </section>

      <section className="mt-6 overflow-x-auto rounded-lg border border-ikea-gray-200 bg-white">
        <div className="border-b border-ikea-gray-200 px-5 py-4">
          <h2 className="text-base font-bold">{t("admin.bookings.listTitle")}</h2>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load()
              }}
              placeholder={t("admin.bookings.placeholderSearch")}
              className="h-9 w-full rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue md:max-w-xs"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
            >
              <option value="">{t("admin.bookings.allStatuses")}</option>
              <option value="0">{t("admin.bookings.statusPending")}</option>
              <option value="1">{t("admin.bookings.statusConfirmed")}</option>
              <option value="2">{t("admin.bookings.statusCompleted")}</option>
              <option value="3">{t("admin.bookings.statusCancelled")}</option>
            </select>
            <Button variant="secondary" onClick={() => void load()}>
              {t("admin.bookings.search")}
            </Button>
          </div>
        </div>
        {!bookings ? (
          <Loading />
        ) : bookings.length === 0 ? (
          <EmptyState>{t("admin.bookings.empty")}</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colBookingNo")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colName")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colPhone")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colEmail")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colVoucher")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colService")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colStore")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colDate")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colTimeSlot")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colNote")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colStatus")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.bookings.colCreatedAt")}</th>
                <th className="px-5 py-3 text-right font-medium">{t("admin.common.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3 font-medium">{booking.bookingNo}</td>
                  <td className="px-5 py-3">{booking.customerName}</td>
                  <td className="px-5 py-3">{booking.phone}</td>
                  <td className="px-5 py-3">{booking.email}</td>
                  <td className="px-5 py-3">{booking.voucherCodes ?? booking.voucherCode}</td>
                  <td className="px-5 py-3">{booking.serviceType}</td>
                  <td className="px-5 py-3">{booking.store}</td>
                  <td className="px-5 py-3">{booking.preferredDate}</td>
                  <td className="px-5 py-3">{booking.timeSlot || "—"}</td>
                  <td className="px-5 py-3">{booking.note || "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${statusClassName(booking.status)}`}
                    >
                      {t(statusLabelKey(booking.status))}
                    </span>
                  </td>
                  <td className="px-5 py-3">{formatDate(booking.createdAt, locale)}</td>
                  <td className="px-5 py-3 text-right">
                    {booking.status === 0 ? (
                      <>
                        <Button variant="secondary" onClick={() => void updateStatus(booking, 1)}>
                          {t("admin.bookings.confirm")}
                        </Button>{" "}
                        <Button variant="secondary" onClick={() => void updateStatus(booking, 3)}>
                          {t("admin.bookings.cancel")}
                        </Button>{" "}
                      </>
                    ) : null}
                    {booking.status === 1 ? (
                      <>
                        <Button variant="secondary" onClick={() => void updateStatus(booking, 2)}>
                          {t("admin.bookings.complete")}
                        </Button>{" "}
                        <Button variant="secondary" onClick={() => void updateStatus(booking, 3)}>
                          {t("admin.bookings.cancel")}
                        </Button>{" "}
                      </>
                    ) : null}
                    <Button variant="danger" onClick={() => void deleteBooking(booking)}>
                      {t("admin.bookings.delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
