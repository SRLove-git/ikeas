"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"
import { API_BASE, apiJson } from "@/lib/api"

type BookingQuota = {
  limit: number
  booked: number
  remaining: number
}

type FormKey =
  | "customerName"
  | "phone"
  | "email"
  | "serviceType"
  | "store"
  | "preferredDate"
  | "timeSlot"
  | "note"

const WEEKDAYS_ZH = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function upcomingWeekdays(count: number): string[] {
  const days: string[] = []
  const cursor = new Date()
  while (days.length < count) {
    const weekday = cursor.getDay()
    if (weekday !== 0 && weekday !== 6) {
      days.push(toLocalDateString(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function weekdayShort(dateStr: string, lang: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  const names = lang.startsWith("en") ? WEEKDAYS_EN : WEEKDAYS_ZH
  return names[date.getDay()]
}

function monthDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function isWeekday(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export function BookingForm() {
  const { t, i18n } = useTranslation()
  const requiredKeys = new Set<FormKey>([
    "customerName",
    "email",
    "serviceType",
    "store",
    "preferredDate",
  ])
  const [form, setForm] = useState<Record<FormKey, string>>({
    customerName: "",
    phone: "",
    email: "",
    serviceType: "",
    store: "",
    preferredDate: "",
    timeSlot: "",
    note: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [quota, setQuota] = useState<BookingQuota | null>(null)

  useEffect(() => {
    const date = form.preferredDate.trim()
    if (!date) {
      setQuota(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/bookings/quota?date=${encodeURIComponent(date)}`,
        )
        const body = (await response.json().catch(() => null)) as BookingQuota | null
        if (response.ok && body && !cancelled) setQuota(body)
      } catch {
        if (!cancelled) setQuota(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [form.preferredDate])

  const update =
    (key: FormKey) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }))
    }

  const submit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      if (
        !form.customerName.trim() ||
        !form.email.trim() ||
        !form.serviceType ||
        !form.store ||
        !form.preferredDate.trim()
      ) {
        setError(t("bookingForm.incomplete"))
        return
      }
      if (form.phone.trim() && !/^\+?[0-9][0-9\s-]{5,19}$/.test(form.phone.trim())) {
        setError(t("bookingForm.invalidPhone"))
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError(t("bookingForm.invalidEmail"))
        return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.preferredDate.trim())) {
        setError(t("bookingForm.invalidDate"))
        return
      }
      if (!isWeekday(form.preferredDate.trim())) {
        setError(t("bookingForm.weekendUnavailable"))
        return
      }

      const payload: Record<string, unknown> = {
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        serviceType: form.serviceType,
        store: form.store,
        preferredDate: form.preferredDate.trim(),
        timeSlot: form.timeSlot,
        note: form.note,
      }

      const data = await apiJson<{ bookingNo: string }>("/bookings", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      setSuccessId(data.bookingNo)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("bookingForm.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div className="mt-8 rounded bg-ikea-gray-100 px-6 py-8 text-center">
        <h2 className="text-xl font-bold">{t("bookingForm.successTitle")}</h2>
        <p className="mt-2 text-sm text-ikea-muted">
          {t("bookingForm.successBody", { id: successId })}
        </p>
        <p className="mt-1 text-sm text-ikea-muted">{t("bookingForm.successHelp")}</p>
      </div>
    )
  }

  const textFields: [FormKey, string, string, string][] = [
    ["customerName", t("bookingForm.nameLabel"), t("bookingForm.namePlaceholder"), "text"],
    ["phone", t("bookingForm.phoneLabel"), t("bookingForm.phonePlaceholder"), "tel"],
    ["email", t("bookingForm.emailLabel"), t("bookingForm.emailPlaceholder"), "email"],
  ]
  const selectOptions: Partial<Record<FormKey, string[]>> = {
    serviceType: [
      t("bookingForm.serviceOxygen"),
      t("bookingForm.serviceBodyComposition"),
      t("bookingForm.serviceBloodPanel"),
      t("bookingForm.serviceBloodPressure"),
      t("bookingForm.serviceOther"),
    ],
    store: [
      t("bookingForm.storeSagoStreet"),
    ],
    timeSlot: [
      t("bookingForm.slotMorning"),
    ],
  }

  return (
    <>
      {quota && quota.limit > 0 ? (
        <div className="mt-6 rounded-lg border border-ikea-gray-200 bg-ikea-gray-50 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ikea-muted">
              {t("bookingForm.dailyLimit", { limit: quota.limit })}
            </span>
            <span className="font-bold text-green-600">
              {t("bookingForm.remainingQuota", { count: quota.remaining })}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ikea-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${(quota.remaining / quota.limit) * 100}%` }}
            />
          </div>
        </div>
      ) : null}
      <form className="mt-8 grid gap-5 md:grid-cols-2">
      {textFields.map(([key, label, placeholder, type]) => (
        <label key={key} className="block">
          <span className="mb-1.5 block text-sm font-bold">
            {label}
            {requiredKeys.has(key) ? (
              <span className="text-red-600" aria-label={t("bookingForm.required")}>
                {" "}
                *
              </span>
            ) : null}
          </span>
          <input
            type={type}
            placeholder={placeholder}
            value={form[key]}
            onChange={update(key)}
            className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
          />
        </label>
      ))}
      {(["serviceType", "store", "preferredDate", "timeSlot"] as FormKey[]).map((key) => (
        <label key={key} className="block">
          <span className="mb-1.5 block text-sm font-bold">
            {t(`bookingForm.${key}Label`)}
            {requiredKeys.has(key) ? (
              <span className="text-red-600" aria-label={t("bookingForm.required")}>
                {" "}
                *
              </span>
            ) : null}
          </span>
          {key === "preferredDate" ? (
            <div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                {upcomingWeekdays(30).map((date) => {
                  const selected = form[key] === date
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          preferredDate: selected ? "" : date,
                        }))
                      }
                      className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border text-sm transition-colors ${
                        selected
                          ? "border-ikea-blue bg-ikea-blue text-white"
                          : "border-ikea-gray-200 bg-white text-ikea-black hover:border-ikea-blue"
                      }`}
                    >
                      <span className="text-xs opacity-80">
                        {weekdayShort(date, i18n.language)}
                      </span>
                      <span className="mt-0.5 font-bold">{monthDay(date)}</span>
                    </button>
                  )
                })}
              </div>
              <span className="mt-2 block text-xs text-ikea-muted">
                {t("bookingForm.weekdayHint")}
              </span>
            </div>
          ) : (
            <select
              value={form[key]}
              onChange={update(key)}
              className="h-11 w-full border border-ikea-gray-200 bg-white px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
            >
              <option value="">{t(`bookingForm.${key}Placeholder`)}</option>
              {(selectOptions[key] ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-sm font-bold">{t("bookingForm.noteLabel")}</span>
        <textarea
          placeholder={t("bookingForm.notePlaceholder")}
          value={form.note}
          onChange={update("note")}
          rows={4}
          className="w-full border border-ikea-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-ikea-blue"
        />
      </label>

      <div className="md:col-span-2">
        <p className="text-xs leading-relaxed text-ikea-muted">{t("bookingForm.dataUsage")}</p>
        <Link
          href="/zh/privacy-policy/"
          className="mt-1 inline-block text-xs font-bold text-ikea-blue hover:underline"
        >
          {t("bookingForm.privacyPolicy")}
        </Link>
      </div>

      {error ? (
        <p className="rounded bg-red-50 px-4 py-3 text-xs text-red-600 md:col-span-2">{error}</p>
      ) : null}

      <div className="md:col-span-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="i-btn i-btn--primary h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 md:w-auto md:px-16"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label">
              {submitting ? t("bookingForm.submitting") : t("bookingForm.submit")}
            </span>
          </span>
        </button>
      </div>
      </form>
    </>
  )
}
