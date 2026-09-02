"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

type BookingResponse = {
  id: string
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

export function BookingForm() {
  const { t, i18n } = useTranslation()
  const requiredKeys = new Set<FormKey>([
    "customerName",
    "phone",
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
        !form.phone.trim() ||
        !form.email.trim() ||
        !form.serviceType ||
        !form.store ||
        !form.preferredDate.trim()
      ) {
        setError(t("bookingForm.incomplete"))
        return
      }
      if (!/^[89]\d{7}$/.test(form.phone.trim())) {
        setError(t("bookingForm.invalidPhone"))
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError(t("bookingForm.invalidEmail"))
        return
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json().catch(() => null)) as
        (BookingResponse & { error?: string }) | null
      if (!response.ok || !data) {
        setError(data?.error ?? t("bookingForm.submitFailed"))
        return
      }
      setSuccessId(data.id)
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
      t("bookingForm.storeRaffles"),
      t("bookingForm.storeNovena"),
      t("bookingForm.storeParkroyal"),
    ],
    timeSlot: [
      t("bookingForm.slotMorning"),
      t("bookingForm.slotAfternoon"),
      t("bookingForm.slotEvening"),
    ],
  }

  return (
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
            <input
              type="date"
              lang={i18n.language}
              value={form[key]}
              onChange={update(key)}
              className="h-11 w-full border border-ikea-gray-200 px-4 text-sm outline-none transition-colors focus:border-ikea-blue"
            />
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
  )
}
