"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import Image from "next/image"
import {
  adminFetch,
  Button,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui"
import { API_BASE } from "@/lib/api"

interface Coupon {
  id: number
  code: string
  name: string
  type: number
  value: number
  minAmount: number
  status: number
  validFrom: string
  validTo: string
}

interface VoucherClaim {
  id: string
  email: string
  code: string
  createdAt: string
}

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
}

function bookingStatusLabelKey(status: number): string {
  if (status === 1) return "admin.bookings.statusConfirmed"
  if (status === 2) return "admin.bookings.statusCompleted"
  if (status === 3) return "admin.bookings.statusCancelled"
  return "admin.bookings.statusPending"
}

function bookingStatusClassName(status: number): string {
  if (status === 1) return "bg-blue-100 text-blue-700"
  if (status === 2) return "bg-green-100 text-green-700"
  if (status === 3) return "bg-ikea-gray-100 text-ikea-muted"
  return "bg-amber-100 text-amber-700"
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("zh-CN", { hour12: false })
}

export default function MarketingPage() {
  const { t } = useTranslation()
  const [coupons, setCoupons] = useState<Coupon[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "1",
    value: "",
    minAmount: "",
    validFrom: "",
    validTo: "",
  })
  const [adjust, setAdjust] = useState({ userId: "", points: "", balance: "" })
  const [qrCoupon, setQrCoupon] = useState<Coupon | null>(null)
  const [copiedQr, setCopiedQr] = useState(false)
  const [claims, setClaims] = useState<VoucherClaim[] | null>(null)
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [bookingQuery, setBookingQuery] = useState("")
  const [bookingStatus, setBookingStatus] = useState("")
  const [redeemCode, setRedeemCode] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [redeemNotice, setRedeemNotice] = useState<string | null>(null)
  const [quota, setQuota] = useState<{ limit: number; booked: number; remaining: number } | null>(
    null,
  )

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (statusFilter) params.set("status", statusFilter)
      const suffix = params.toString() ? `?${params.toString()}` : ""
      const data = await adminFetch<Coupon[]>(`/api/admin/server/marketing/coupons${suffix}`)
      setCoupons(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const loadClaims = async () => {
    try {
      const data = await adminFetch<VoucherClaim[]>("/api/admin/server/experience-vouchers/claims")
      setClaims(data)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const deleteClaim = async (claim: VoucherClaim) => {
    if (!window.confirm(t("admin.marketing.confirmDeleteClaim"))) return
    try {
      await adminFetch(`/api/admin/server/experience-vouchers/claims/${claim.id}`, {
        method: "DELETE",
      })
      await loadClaims()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const loadBookings = async () => {
    try {
      const params = new URLSearchParams()
      if (bookingQuery.trim()) params.set("q", bookingQuery.trim())
      if (bookingStatus) params.set("status", bookingStatus)
      const suffix = params.toString() ? `?${params.toString()}` : ""
      const data = await adminFetch<Booking[]>(`/api/admin/server/bookings${suffix}`)
      setBookings(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const loadQuota = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/bookings/quota`)
      const body = (await response.json().catch(() => null)) as {
        limit?: number
        booked?: number
        remaining?: number
      } | null
      if (response.ok && body?.limit != null) {
        setQuota({ limit: body.limit, booked: body.booked ?? 0, remaining: body.remaining ?? 0 })
      }
    } catch {
      setQuota(null)
    }
  }

  const redeemBooking = async () => {
    if (!redeemCode.trim()) {
      setRedeemNotice(t("admin.bookings.redeemEmpty"))
      return
    }
    setRedeeming(true)
    setRedeemNotice(null)
    try {
      const booking = await adminFetch<Booking>("/api/admin/server/bookings/redeem", {
        method: "POST",
        body: JSON.stringify({ code: redeemCode.trim() }),
      })
      setRedeemNotice(t("admin.bookings.redeemSuccess", { no: booking.bookingNo }))
      setRedeemCode("")
      await Promise.all([loadBookings(), loadQuota()])
    } catch (e) {
      setRedeemNotice((e as Error).message)
    } finally {
      setRedeeming(false)
    }
  }

  const updateBookingStatus = async (booking: Booking, status: number) => {
    try {
      await adminFetch(`/api/admin/server/bookings/${booking.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      await Promise.all([loadBookings(), loadQuota()])
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
      await Promise.all([loadBookings(), loadQuota()])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Coupon[]>("/api/admin/server/marketing/coupons")
        setCoupons(data)
        setError(null)
      } catch (e) {
        setError((e as Error).message)
      }
    })()
    void (async () => {
      try {
        const data = await adminFetch<VoucherClaim[]>(
          "/api/admin/server/experience-vouchers/claims",
        )
        setClaims(data)
      } catch {
        setClaims([])
      }
    })()
  }, [])

  useEffect(() => {
    void loadBookings()
    void loadQuota()
  }, [])

  const createCoupon = async () => {
    try {
      await adminFetch("/api/admin/server/marketing/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          type: Number(form.type),
          value: Number(form.value),
          minAmount: Number(form.minAmount),
          status: 1,
          validFrom: form.validFrom,
          validTo: form.validTo,
        }),
      })
      setForm({
        code: "",
        name: "",
        type: "1",
        value: "",
        minAmount: "",
        validFrom: "",
        validTo: "",
      })
      setEditing(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const startEdit = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      name: coupon.name,
      type: String(coupon.type),
      value: String(coupon.value),
      minAmount: String(coupon.minAmount),
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setForm({ code: "", name: "", type: "1", value: "", minAmount: "", validFrom: "", validTo: "" })
  }

  const saveCoupon = async () => {
    if (!editing) return
    try {
      await adminFetch(`/api/admin/server/marketing/coupons/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          type: Number(form.type),
          value: Number(form.value),
          minAmount: Number(form.minAmount),
          status: editing.status,
          validFrom: form.validFrom,
          validTo: form.validTo,
        }),
      })
      cancelEdit()
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      await adminFetch(`/api/admin/server/marketing/coupons/${coupon.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: coupon.status === 1 ? 0 : 1 }),
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const deleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(t("admin.marketing.confirmDelete"))) return
    try {
      await adminFetch(`/api/admin/server/marketing/coupons/${coupon.id}`, {
        method: "DELETE",
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const exportCsv = () => {
    if (!coupons?.length) return
    const header = ["Code", "Name", "Type", "Value", "Min amount", "Status"]
    const rows = coupons.map((coupon) => [
      coupon.code,
      coupon.name,
      coupon.type === 2 ? "discount" : "amount-off",
      String(coupon.value),
      String(coupon.minAmount),
      coupon.status === 1 ? "enabled" : "disabled",
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n")
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "coupons.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const adjustAccount = async () => {
    try {
      await adminFetch(`/api/admin/server/marketing/accounts/${adjust.userId}/adjust`, {
        method: "POST",
        body: JSON.stringify({
          points: Number(adjust.points || 0),
          balance: Number(adjust.balance || 0),
        }),
      })
      setAdjust({ userId: "", points: "", balance: "" })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const claimUrl = qrCoupon
    ? `${typeof window === "undefined" ? "" : window.location.origin}/zh/coupon?code=${encodeURIComponent(qrCoupon.code)}`
    : ""

  const copyClaimUrl = async () => {
    if (!claimUrl) return
    await navigator.clipboard.writeText(claimUrl)
    setCopiedQr(true)
    window.setTimeout(() => setCopiedQr(false), 1500)
  }

  return (
    <div>
      <PageHeader title={t("admin.marketing.title")} description={t("admin.marketing.desc")} />

      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
          <div className="border-b border-ikea-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">{t("admin.marketing.couponList")}</h2>
            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load()
                }}
                placeholder={t("admin.marketing.placeholderSearch")}
                className="h-9 w-full rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue md:max-w-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
              >
                <option value="">{t("admin.marketing.allStatuses")}</option>
                <option value="1">{t("admin.marketing.enabled")}</option>
                <option value="0">{t("admin.marketing.disabled")}</option>
              </select>
              <Button variant="secondary" onClick={() => void load()}>
                {t("admin.marketing.search")}
              </Button>
              <Button variant="secondary" onClick={exportCsv}>
                {t("admin.marketing.exportCsv")}
              </Button>
            </div>
          </div>
          {!coupons ? (
            <Loading />
          ) : coupons.length === 0 ? (
            <EmptyState>{t("admin.marketing.emptyCoupons")}</EmptyState>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colCode")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colName")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colType")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colThreshold")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colStatus")}</th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t("admin.common.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ikea-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-ikea-gray-50">
                    <td className="px-5 py-3 font-medium">{coupon.code}</td>
                    <td className="px-5 py-3">{coupon.name}</td>
                    <td className="px-5 py-3">
                      {coupon.type === 2 ? t("admin.marketing.discount") : t("admin.marketing.off")}
                    </td>
                    <td className="px-5 py-3">
                      {coupon.minAmount} / {coupon.value}
                      {coupon.type === 2 ? "%" : ""}
                    </td>
                    <td className="px-5 py-3">
                      {coupon.status === 1
                        ? t("admin.marketing.enabled")
                        : t("admin.marketing.disabled")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="secondary"
                        onClick={() => setQrCoupon(qrCoupon?.id === coupon.id ? null : coupon)}
                      >
                        {t("admin.marketing.qrCode")}
                      </Button>{" "}
                      <Button variant="secondary" onClick={() => startEdit(coupon)}>
                        {t("admin.marketing.edit")}
                      </Button>{" "}
                      <Button variant="secondary" onClick={() => toggleCoupon(coupon)}>
                        {coupon.status === 1
                          ? t("admin.marketing.disable")
                          : t("admin.marketing.enable")}
                      </Button>{" "}
                      <Button variant="danger" onClick={() => void deleteCoupon(coupon)}>
                        {t("admin.marketing.delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {qrCoupon ? (
            <div className="border-t border-ikea-gray-200 bg-ikea-gray-50 px-5 py-5">
              <div className="flex flex-col gap-5 sm:flex-row">
                <Image
                  src={`${API_BASE}/api/v1/marketing/coupons/${qrCoupon.id}/qr.png`}
                  alt={`${qrCoupon.code} QR code`}
                  width={192}
                  height={192}
                  unoptimized
                  className="h-48 w-48 rounded border border-ikea-gray-200 bg-white p-2"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">{t("admin.marketing.couponQr")}</h3>
                  <p className="mt-2 text-xs leading-5 text-ikea-muted">
                    {t("admin.marketing.couponQrHint")}
                  </p>
                  <p className="mt-3 break-all rounded border border-ikea-gray-200 bg-white px-3 py-2 text-xs">
                    {claimUrl}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => void copyClaimUrl()}>
                      {copiedQr
                        ? t("admin.marketing.copiedClaimLink")
                        : t("admin.marketing.copyClaimLink")}
                    </Button>
                    <a
                      href={claimUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-ikea-blue px-3.5 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      {t("admin.marketing.openClaimPage")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">
              {editing ? t("admin.marketing.editCoupon") : t("admin.marketing.newCoupon")}
            </h2>
            <div className="mt-4 space-y-3">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder={t("admin.marketing.placeholderCode")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("admin.marketing.colName")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              >
                <option value="1">{t("admin.marketing.off")}</option>
                <option value="2">{t("admin.marketing.discount")}</option>
              </select>
              <input
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={t("admin.marketing.placeholderValue")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <input
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                placeholder={t("admin.marketing.placeholderMin")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <input
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                placeholder={t("admin.marketing.placeholderValidFrom")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <input
                value={form.validTo}
                onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                placeholder={t("admin.marketing.placeholderValidTo")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              {editing ? (
                <div className="flex gap-2">
                  <Button onClick={() => void saveCoupon()}>
                    {t("admin.marketing.saveCoupon")}
                  </Button>
                  <Button variant="secondary" onClick={cancelEdit}>
                    {t("admin.marketing.cancelEdit")}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => void createCoupon()}>
                  {t("admin.marketing.createCoupon")}
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">{t("admin.marketing.adjustAccount")}</h2>
            <div className="mt-4 space-y-3">
              <input
                value={adjust.userId}
                onChange={(e) => setAdjust({ ...adjust, userId: e.target.value })}
                placeholder={t("admin.marketing.placeholderUserId")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <input
                value={adjust.points}
                onChange={(e) => setAdjust({ ...adjust, points: e.target.value })}
                placeholder={t("admin.marketing.placeholderPoints")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <input
                value={adjust.balance}
                onChange={(e) => setAdjust({ ...adjust, balance: e.target.value })}
                placeholder={t("admin.marketing.placeholderBalance")}
                className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue"
              />
              <Button onClick={() => void adjustAccount()}>
                {t("admin.marketing.saveAdjust")}
              </Button>
            </div>
          </section>
        </div>

        <section className="mt-6 overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-ikea-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">{t("admin.marketing.voucherClaims")}</h2>
            <Button variant="secondary" onClick={() => void loadClaims()}>
              {t("admin.marketing.refresh")}
            </Button>
          </div>
          {!claims ? (
            <Loading />
          ) : claims.length === 0 ? (
            <EmptyState>{t("admin.marketing.emptyClaims")}</EmptyState>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t("admin.marketing.colEmail")}</th>
                    <th className="px-5 py-3 font-medium">{t("admin.marketing.colVoucher")}</th>
                    <th className="px-5 py-3 font-medium">{t("admin.marketing.colTime")}</th>
                    <th className="px-5 py-3 text-right font-medium">
                      {t("admin.common.colActions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ikea-gray-200">
                  {claims.map((claim, index) => (
                    <tr key={`${claim.email}-${index}`} className="hover:bg-ikea-gray-50">
                      <td className="px-5 py-3">{claim.email}</td>
                      <td className="px-5 py-3 font-mono text-xs font-bold">{claim.code}</td>
                      <td className="px-5 py-3 text-ikea-muted">
                        {claim.createdAt ? new Date(claim.createdAt).toLocaleString("zh-CN") : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button variant="danger" onClick={() => void deleteClaim(claim)}>
                          {t("admin.marketing.delete")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-ikea-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold">{t("admin.marketing.bookingRedemptionTitle")}</h2>
            <p className="mt-1 text-xs leading-5 text-ikea-muted">
              {t("admin.marketing.bookingRedemptionHint")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {quota ? (
              <span className="rounded bg-ikea-gray-100 px-3 py-1.5 text-xs font-bold text-ikea-muted">
                {t("admin.marketing.bookingQuota", {
                  booked: quota.booked,
                  limit: quota.limit,
                  remaining: quota.remaining,
                })}
              </span>
            ) : null}
            <Button variant="secondary" onClick={() => void loadBookings()}>
              {t("admin.marketing.refresh")}
            </Button>
          </div>
        </div>

        <div className="border-b border-ikea-gray-200 bg-ikea-blue/5 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={redeemCode}
              onChange={(event) => setRedeemCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !redeeming) void redeemBooking()
              }}
              placeholder={t("admin.bookings.redeemPlaceholder")}
              className="h-10 flex-1 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
            />
            <Button onClick={() => void redeemBooking()} disabled={redeeming}>
              {redeeming ? t("admin.bookings.redeeming") : t("admin.bookings.redeem")}
            </Button>
          </div>
          {redeemNotice ? <p className="mt-3 text-sm text-ikea-blue">{redeemNotice}</p> : null}
        </div>

        <div className="flex flex-col gap-2 border-b border-ikea-gray-200 px-5 py-4 md:flex-row">
          <input
            value={bookingQuery}
            onChange={(event) => setBookingQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void loadBookings()
            }}
            placeholder={t("admin.bookings.placeholderSearch")}
            className="h-9 w-full rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue md:max-w-xs"
          />
          <select
            value={bookingStatus}
            onChange={(event) => setBookingStatus(event.target.value)}
            className="h-9 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
          >
            <option value="">{t("admin.bookings.allStatuses")}</option>
            <option value="0">{t("admin.bookings.statusPending")}</option>
            <option value="1">{t("admin.bookings.statusConfirmed")}</option>
            <option value="2">{t("admin.bookings.statusCompleted")}</option>
            <option value="3">{t("admin.bookings.statusCancelled")}</option>
          </select>
          <Button variant="secondary" onClick={() => void loadBookings()}>
            {t("admin.bookings.search")}
          </Button>
        </div>

        {!bookings ? (
          <Loading />
        ) : bookings.length === 0 ? (
          <EmptyState>{t("admin.bookings.empty")}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
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
                  <th className="px-5 py-3 font-medium">{t("admin.bookings.colStatus")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.bookings.colCreatedAt")}</th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t("admin.common.colActions")}
                  </th>
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
                    <td className="px-5 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${bookingStatusClassName(booking.status)}`}
                      >
                        {t(bookingStatusLabelKey(booking.status))}
                      </span>
                    </td>
                    <td className="px-5 py-3">{formatDate(booking.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      {booking.status === 0 ? (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => void updateBookingStatus(booking, 1)}
                          >
                            {t("admin.bookings.confirm")}
                          </Button>{" "}
                          <Button
                            variant="secondary"
                            onClick={() => void updateBookingStatus(booking, 3)}
                          >
                            {t("admin.bookings.cancel")}
                          </Button>{" "}
                        </>
                      ) : null}
                      {booking.status === 1 ? (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => void updateBookingStatus(booking, 2)}
                          >
                            {t("admin.bookings.complete")}
                          </Button>{" "}
                          <Button
                            variant="secondary"
                            onClick={() => void updateBookingStatus(booking, 3)}
                          >
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
          </div>
        )}
      </section>
    </div>
  )
}
