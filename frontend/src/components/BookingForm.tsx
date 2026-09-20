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

function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function dateLabel(dateStr: string, lang: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  const names = lang.startsWith("en")
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]
  return `${toLocalDateString(date).replace(/-/g, "/")} ${names[date.getDay()]}`
}

function BookingDatePicker({
  value,
  lang,
  onChange,
}: {
  value: string
  lang: string
  onChange: (date: string) => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [view, setView] = useState<Date>(() => {
    const base = value ? new Date(`${value}T00:00:00`) : new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const headers = lang.startsWith("en")
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["日", "一", "二", "三", "四", "五", "六"]

  const monthLabel = lang.startsWith("en")
    ? `${view.toLocaleString("en-SG", { month: "long" })} ${year}`
    : `${year}年${month + 1}月`

  const canGoPrev =
    year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())

  return (
    <div className="rounded-xl border border-ikea-gray-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ikea-muted hover:bg-ikea-gray-100 disabled:opacity-30"
          aria-label="prev"
        >
          ‹
        </button>
        <span className="text-sm font-bold">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ikea-muted hover:bg-ikea-gray-100"
          aria-label="next"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ikea-muted">
        {headers.map((header) => (
          <span key={header} className="py-1">
            {header}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} />
          const weekday = cell.getDay()
          const isWeekend = weekday === 0 || weekday === 6
          const isPast = cell < today
          const disabled = isWeekend || isPast
          const dateStr = toLocalDateString(cell)
          const selected = value === dateStr
          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              className={`flex h-9 items-center justify-center rounded-lg text-sm transition-colors ${
                selected
                  ? "bg-ikea-blue font-bold text-white"
                  : disabled
                    ? "text-ikea-gray-300"
                    : "text-ikea-black hover:bg-ikea-gray-100"
              }`}
            >
              {cell.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BookingDateField({
  value,
  lang,
  placeholder,
  onChange,
}: {
  value: string
  lang: string
  placeholder: string
  onChange: (date: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative ${open ? "z-30" : ""}`}>
      <input
        type="text"
        readOnly
        value={value ? dateLabel(value, lang) : ""}
        placeholder={placeholder}
        onClick={() => setOpen((current) => !current)}
        className="h-11 w-full cursor-pointer border border-ikea-gray-200 px-4 pr-10 text-sm outline-none transition-colors focus:border-ikea-blue"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ikea-muted">
        ▾
      </span>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-20 mt-1 w-full min-w-[280px]">
            <BookingDatePicker
              value={value}
              lang={lang}
              onChange={(date) => {
                onChange(date)
                setOpen(false)
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  )
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
              <BookingDateField
                value={form[key]}
                lang={i18n.language}
                placeholder={t("bookingForm.preferredDatePlaceholder")}
                onChange={(date) => setForm((current) => ({ ...current, preferredDate: date }))}
              />
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
