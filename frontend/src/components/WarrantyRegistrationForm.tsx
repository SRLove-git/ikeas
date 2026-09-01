"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslation } from "react-i18next"

type RegistrationResponse = {
  id: string
}

type FormKey =
  | "customerName"
  | "phone"
  | "email"
  | "purchaseDate"
  | "productName"
  | "model"
  | "invoiceNo"
  | "note"

export function WarrantyRegistrationForm() {
  const { t } = useTranslation()
  const requiredKeys = new Set<FormKey>([
    "customerName",
    "phone",
    "email",
    "purchaseDate",
    "productName",
  ])
  const fields: [FormKey, string, string, string][] = [
    ["customerName", t("warrantyForm.nameLabel"), t("warrantyForm.namePlaceholder"), "text"],
    ["phone", t("warrantyForm.phoneLabel"), t("warrantyForm.phonePlaceholder"), "tel"],
    ["email", t("warrantyForm.emailLabel"), t("warrantyForm.emailPlaceholder"), "email"],
    [
      "purchaseDate",
      t("warrantyForm.purchaseDateLabel"),
      t("warrantyForm.purchaseDatePlaceholder"),
      "date",
    ],
    [
      "productName",
      t("warrantyForm.productNameLabel"),
      t("warrantyForm.productNamePlaceholder"),
      "text",
    ],
    ["model", t("warrantyForm.modelLabel"), t("warrantyForm.modelPlaceholder"), "text"],
    ["invoiceNo", t("warrantyForm.invoiceNoLabel"), t("warrantyForm.invoiceNoPlaceholder"), "text"],
  ]
  const [form, setForm] = useState<Record<FormKey, string>>({
    customerName: "",
    phone: "",
    email: "",
    productName: "",
    model: "",
    purchaseDate: "",
    invoiceNo: "",
    note: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const update =
    (key: FormKey) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        !form.productName.trim() ||
        !form.purchaseDate.trim()
      ) {
        setError(t("warrantyForm.incomplete"))
        return
      }
      if (!/^[89]\d{7}$/.test(form.phone.trim())) {
        setError(t("warrantyForm.invalidPhone"))
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError(t("warrantyForm.invalidEmail"))
        return
      }

      const response = await fetch("/api/warranty-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json().catch(() => null)) as
        (RegistrationResponse & { error?: string }) | null
      if (!response.ok || !data) {
        setError(data?.error ?? t("warrantyForm.submitFailed"))
        return
      }
      setSuccessId(data.id)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : t("warrantyForm.submitFailed"))
    } finally {
      setSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div className="mt-8 rounded bg-ikea-gray-100 px-6 py-8 text-center">
        <h2 className="text-xl font-bold">{t("warrantyForm.successTitle")}</h2>
        <p className="mt-2 text-sm text-ikea-muted">
          {t("warrantyForm.successBody", { id: successId })}
        </p>
        <p className="mt-1 text-sm text-ikea-muted">{t("warrantyForm.successHelp")}</p>
      </div>
    )
  }

  return (
    <form className="mt-8 grid gap-5 md:grid-cols-2">
      {fields.map(([key, label, placeholder, type]) => (
        <label key={key} className="block">
          <span className="mb-1.5 block text-sm font-bold">
            {label}
            {requiredKeys.has(key) ? (
              <span className="text-red-600" aria-label={t("warrantyForm.required")}>
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
      <label className="block md:col-span-2">
        <span className="mb-1.5 block text-sm font-bold">{t("warrantyForm.noteLabel")}</span>
        <textarea
          placeholder={t("warrantyForm.notePlaceholder")}
          value={form.note}
          onChange={update("note")}
          rows={4}
          className="w-full border border-ikea-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-ikea-blue"
        />
      </label>

      <div className="md:col-span-2">
        <p className="text-xs leading-relaxed text-ikea-muted">{t("warrantyForm.dataUsage")}</p>
        <Link
          href="/zh/privacy-policy/"
          className="mt-1 inline-block text-xs font-bold text-ikea-blue hover:underline"
        >
          {t("warrantyForm.privacyPolicy")}
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
              {submitting ? t("warrantyForm.submitting") : t("warrantyForm.submit")}
            </span>
          </span>
        </button>
      </div>
    </form>
  )
}
