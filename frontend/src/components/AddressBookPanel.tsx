"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Breadcrumbs } from "@/components/Breadcrumbs"

interface ShippingAddress {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  isDefault: boolean
}

const ADDRESS_KEY = "buzud_shipping_addresses"

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readAddresses(): ShippingAddress[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(ADDRESS_KEY)
    const parsed = raw ? (JSON.parse(raw) as ShippingAddress[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAddresses(addresses: ShippingAddress[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses))
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1 flex items-center gap-1 text-xs text-red-600">
      <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
        <path
          d="M17 9c0 4.4183-3.5817 8-8 8s-8-3.5817-8-8 3.5817-8 8-8 8 3.5817 8 8z"
          fill="rgb(224, 7, 81)"
        />
        <path fillRule="evenodd" clipRule="evenodd" d="M8 9.5V5h2v4.5H8z" fill="#fff" />
        <path
          d="M10.25 12.25c0 .6904-.5596 1.25-1.25 1.25s-1.25-.5596-1.25-1.25S8.3096 11 9 11s1.25.5596 1.25 1.25z"
          fill="#fff"
        />
      </svg>
      {children}
    </span>
  )
}

export function AddressBookPanel() {
  const router = useRouter()
  const { user, ready } = useAuth()
  const [addresses, setAddresses] = useState<ShippingAddress[]>(() => readAddresses())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    region: "",
    detail: "",
    isDefault: false,
  })
  const [formErrors, setFormErrors] = useState<{
    name?: string
    phone?: string
    region?: string
    detail?: string
  }>({})

  useEffect(() => {
    if (ready && !user) {
      router.replace("/cn/zh/profile/login/")
      return
    }
  }, [ready, user, router])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  const openCreate = () => {
    setEditingId(null)
    setFormErrors({})
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      region: "",
      detail: "",
      isDefault: addresses.length === 0,
    })
    setDrawerOpen(true)
  }

  const openEdit = (address: ShippingAddress) => {
    setEditingId(address.id)
    setFormErrors({})
    setForm({
      name: address.name,
      phone: address.phone,
      region: address.region,
      detail: address.detail,
      isDefault: address.isDefault,
    })
    setDrawerOpen(true)
  }

  const saveAddress = () => {
    const nextErrors: {
      name?: string
      phone?: string
      region?: string
      detail?: string
    } = {}
    if (!form.name.trim()) nextErrors.name = "请输入姓名"
    if (!form.phone.trim()) nextErrors.phone = "请输入手机号"
    if (!form.region.trim()) nextErrors.region = "请选择正确的省/市/区"
    if (!form.detail.trim()) nextErrors.detail = "请输入详细地址"
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setNotice(null)
      return
    }

    let next: ShippingAddress[]
    if (editingId) {
      next = addresses.map((address) =>
        address.id === editingId
          ? {
              ...address,
              ...form,
              name: form.name.trim(),
              phone: form.phone.trim(),
              region: form.region.trim(),
              detail: form.detail.trim(),
            }
          : form.isDefault
            ? { ...address, isDefault: false }
            : address,
      )
    } else {
      const base = addresses.map((address) => ({
        ...address,
        isDefault: form.isDefault ? false : address.isDefault,
      }))
      next = [
        ...base,
        {
          id: newId(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          region: form.region.trim(),
          detail: form.detail.trim(),
          isDefault: form.isDefault,
        },
      ]
    }

    writeAddresses(next)
    setAddresses(next)
    setDrawerOpen(false)
    setFormErrors({})
    setNotice(editingId ? "收货地址已更新" : "收货地址已保存")
  }

  const removeAddress = (id: string) => {
    const next = addresses.filter((address) => address.id !== id)
    writeAddresses(next)
    setAddresses(next)
    setNotice("收货地址已删除")
  }

  const setDefault = (id: string) => {
    const next = addresses.map((address) => ({
      ...address,
      isDefault: address.id === id,
    }))
    writeAddresses(next)
    setAddresses(next)
  }

  if (!ready || !user) {
    return (
      <div className="font-ikea flex min-h-[50vh] items-center justify-center text-sm text-ikea-muted">
        加载中…
      </div>
    )
  }

  return (
    <div className="font-ikea min-h-screen bg-ikea-gray-100 text-ikea-black">
      <div className="max-w-page mx-auto px-5 py-10 lg:px-10">
        <Breadcrumbs currentLabel="收货地址" />

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h1 className="text-2xl font-bold leading-9">收货地址</h1>
          {addresses.length > 0 ? (
            <button
              type="button"
              onClick={openCreate}
              className="i-btn i-btn--small i-btn--primary h-10 px-5 text-sm font-bold"
            >
              +新建收货地址
            </button>
          ) : null}
        </div>

        {notice ? (
          <p className="mt-4 rounded bg-blue-50 px-4 py-3 text-sm text-ikea-blue">{notice}</p>
        ) : null}

        {addresses.length === 0 ? (
          <div className="empty-wrapper mt-12 flex flex-col items-center justify-center bg-white py-20">
            <p className="text-sm text-ikea-muted">还没有收货地址</p>
            <button
              type="button"
              onClick={openCreate}
              className="i-btn i-btn--small i-btn--primary mt-6 h-10 px-6 text-sm font-bold"
            >
              +新建收货地址
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <section key={address.id} className="bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold">{address.name}</p>
                      <p className="text-sm text-ikea-muted">{address.phone}</p>
                      {address.isDefault ? (
                        <span className="rounded bg-ikea-gray-100 px-2 py-0.5 text-xs font-bold text-ikea-muted">
                          默认
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ikea-muted">
                      {address.region} {address.detail}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-ikea-gray-100 pt-4 text-sm">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="font-bold text-ikea-blue hover:underline"
                  >
                    编辑
                  </button>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      onClick={() => setDefault(address.id)}
                      className="text-ikea-muted hover:text-ikea-black"
                    >
                      设为默认
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeAddress(address.id)}
                    className="ml-auto text-ikea-muted hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[1100]" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ikea-gray-200 px-6 py-4">
              <h2 className="text-base font-bold">{editingId ? "编辑收货地址" : "新建收货地址"}</h2>
              <button
                type="button"
                aria-label="关闭"
                className="flex h-8 w-8 items-center justify-center text-ikea-muted hover:text-ikea-black"
                onClick={() => setDrawerOpen(false)}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="m12 10.6 6-6 1.4 1.4-6 6 6 6-1.4 1.4-6-6-6 6L4.6 18l6-6-6-6L6 4.6z" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div>
                  <label htmlFor="address-name" className="block text-sm font-bold">
                    收货人
                    <em className="ml-0.5 text-red-600">*</em>
                  </label>
                  <div
                    className={`mt-1.5 h-11 border ${
                      formErrors.name
                        ? "border-red-500"
                        : "border-ikea-gray-200 focus-within:border-ikea-blue"
                    }`}
                  >
                    <input
                      id="address-name"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="请输入姓名"
                      className="h-full w-full px-4 text-sm outline-none"
                    />
                  </div>
                  {formErrors.name ? <FieldError>{formErrors.name}</FieldError> : null}
                </div>

                <div>
                  <label htmlFor="address-phone" className="block text-sm font-bold">
                    手机号
                    <em className="ml-0.5 text-red-600">*</em>
                  </label>
                  <div
                    className={`mt-1.5 flex h-11 items-center border ${
                      formErrors.phone
                        ? "border-red-500"
                        : "border-ikea-gray-200 focus-within:border-ikea-blue"
                    }`}
                  >
                    <span className="flex h-full items-center border-r border-ikea-gray-200 px-3 text-sm text-ikea-muted">
                      +65
                    </span>
                    <input
                      id="address-phone"
                      type="tel"
                      maxLength={11}
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      placeholder="请输入手机号"
                      className="h-full flex-1 px-4 text-sm outline-none"
                    />
                  </div>
                  {formErrors.phone ? <FieldError>{formErrors.phone}</FieldError> : null}
                </div>

                <div>
                  <label htmlFor="address-region" className="block text-sm font-bold">
                    选择省/市/区
                    <em className="ml-0.5 text-red-600">*</em>
                  </label>
                  <div
                    className={`mt-1.5 h-11 border ${
                      formErrors.region
                        ? "border-red-500"
                        : "border-ikea-gray-200 focus-within:border-ikea-blue"
                    }`}
                  >
                    <input
                      id="address-region"
                      value={form.region}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, region: event.target.value }))
                      }
                      placeholder="请选择省份/地区"
                      className="h-full w-full px-4 text-sm outline-none"
                    />
                  </div>
                  {formErrors.region ? <FieldError>{formErrors.region}</FieldError> : null}
                </div>

                <div>
                  <label htmlFor="address-detail" className="block text-sm font-bold">
                    详细地址
                    <em className="ml-0.5 text-red-600">*</em>
                  </label>
                  <div
                    className={`mt-1.5 border ${
                      formErrors.detail
                        ? "border-red-500"
                        : "border-ikea-gray-200 focus-within:border-ikea-blue"
                    }`}
                  >
                    <input
                      id="address-detail"
                      value={form.detail}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, detail: event.target.value }))
                      }
                      placeholder="请输入详细地址"
                      className="h-11 w-full px-4 text-sm outline-none"
                    />
                  </div>
                  {formErrors.detail ? <FieldError>{formErrors.detail}</FieldError> : null}
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="address-default" className="text-sm">
                    设置为默认地址
                  </label>
                  <button
                    id="address-default"
                    type="button"
                    role="switch"
                    aria-checked={form.isDefault}
                    onClick={() =>
                      setForm((current) => ({ ...current, isDefault: !current.isDefault }))
                    }
                    className={`relative h-5 w-9 rounded-full p-0.5 transition-colors ${
                      form.isDefault ? "bg-ikea-blue" : "bg-ikea-gray-300"
                    }`}
                  >
                    <span
                      className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                        form.isDefault ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-ikea-gray-200 px-6 py-5">
              <button
                type="button"
                onClick={saveAddress}
                className="i-btn i-btn--primary h-11 w-full text-sm font-bold text-white"
              >
                <span className="i-btn__inner">
                  <span className="i-btn__label">保存</span>
                </span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
