"use client"

import { useState } from "react"

type RegistrationResponse = {
  id: string
}

const fields = [
  ["customerName", "姓名", "请输入姓名", "text"],
  ["phone", "手机号", "请输入手机号", "tel"],
  ["email", "邮箱", "请输入邮箱", "email"],
  ["purchaseDate", "购买日期", "请选择购买日期", "date"],
  ["productName", "商品名称", "请输入商品名称", "text"],
  ["model", "型号 / SKU", "请输入型号或 SKU", "text"],
  ["invoiceNo", "发票号", "请输入发票号", "text"],
] as const

type FormKey = (typeof fields)[number][0] | "note"

export function WarrantyRegistrationForm() {
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
    (key: FormKey) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        setError("请填写姓名、联系方式、商品名称和购买日期")
        return
      }
      if (!/^1\d{10}$/.test(form.phone.trim())) {
        setError("请输入正确的 11 位手机号")
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        setError("请输入正确的邮箱")
        return
      }

      const response = await fetch("/api/warranty-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json().catch(() => null)) as
        | (RegistrationResponse & { error?: string })
        | null
      if (!response.ok || !data) {
        setError(data?.error ?? "提交失败，请稍后重试")
        return
      }
      setSuccessId(data.id)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "提交失败，请稍后重试")
    } finally {
      setSubmitting(false)
    }
  }

  if (successId) {
    return (
      <div className="mt-8 rounded bg-ikea-gray-100 px-6 py-8 text-center">
        <h2 className="text-xl font-bold">注册成功</h2>
        <p className="mt-2 text-sm text-ikea-muted">
          您的保修登记编号为 {successId}，请截图或记录保存。
        </p>
        <p className="mt-1 text-sm text-ikea-muted">如需人工协助，请联系 +65 6518 9979。</p>
      </div>
    )
  }

  return (
    <form className="mt-8 grid gap-5 md:grid-cols-2">
      {fields.map(([key, label, placeholder, type]) => (
        <label key={key} className="block">
          <span className="mb-1.5 block text-sm font-bold">{label}</span>
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
        <span className="mb-1.5 block text-sm font-bold">备注</span>
        <textarea
          placeholder="其他需要说明的信息（选填）"
          value={form.note}
          onChange={update("note")}
          rows={4}
          className="w-full border border-ikea-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-ikea-blue"
        />
      </label>

      {error ? (
        <p className="rounded bg-red-50 px-4 py-3 text-xs text-red-600 md:col-span-2">
          {error}
        </p>
      ) : null}

      <div className="md:col-span-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="i-btn i-btn--primary h-11 w-full text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 md:w-auto md:px-16"
        >
          <span className="i-btn__inner">
            <span className="i-btn__label">{submitting ? "提交中…" : "提交保修注册"}</span>
          </span>
        </button>
      </div>
    </form>
  )
}
