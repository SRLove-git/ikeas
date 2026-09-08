"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  adminFetch,
  Button,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
  TextArea,
  TextInput,
} from "@/components/admin/admin-ui"

interface HealthCheckVoucher {
  id: number
  code: string
  status: number
  usedBookingId?: string | null
  usedAt?: string | null
  remark?: string | null
  createdAt: string
}

function statusLabelKey(status: number): string {
  if (status === 1) return "admin.vouchers.statusUsed"
  if (status === 2) return "admin.vouchers.statusDisabled"
  return "admin.vouchers.statusUnused"
}

export default function VouchersPage() {
  const { t } = useTranslation()
  const [vouchers, setVouchers] = useState<HealthCheckVoucher[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [codes, setCodes] = useState("")
  const [remark, setRemark] = useState("")
  const [editing, setEditing] = useState<HealthCheckVoucher | null>(null)
  const [editRemark, setEditRemark] = useState("")

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (statusFilter) params.set("status", statusFilter)
      const suffix = params.toString() ? `?${params.toString()}` : ""
      const data = await adminFetch<HealthCheckVoucher[]>(
        `/api/admin/server/experience-vouchers${suffix}`,
      )
      setVouchers(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await adminFetch<HealthCheckVoucher[]>("/api/admin/server/experience-vouchers")
        if (!cancelled) {
          setVouchers(data)
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

  const createVouchers = async () => {
    try {
      const parsed = codes
        .split(/[\n,，\s]+/)
        .map((code) => code.trim())
        .filter(Boolean)
      if (parsed.length === 0) {
        setError(t("admin.vouchers.emptyInput"))
        return
      }
      await adminFetch("/api/admin/server/experience-vouchers", {
        method: "POST",
        body: JSON.stringify({ codes: parsed, remark }),
      })
      setCodes("")
      setRemark("")
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const toggleVoucher = async (voucher: HealthCheckVoucher) => {
    try {
      const nextStatus = voucher.status === 2 ? 0 : 2
      await adminFetch(`/api/admin/server/experience-vouchers/${voucher.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const startEdit = (voucher: HealthCheckVoucher) => {
    setEditing(voucher)
    setEditRemark(voucher.remark ?? "")
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditRemark("")
  }

  const saveVoucher = async () => {
    if (!editing) return
    try {
      await adminFetch(`/api/admin/server/experience-vouchers/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ remark: editRemark }),
      })
      cancelEdit()
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const deleteVoucher = async (voucher: HealthCheckVoucher) => {
    if (!window.confirm(t("admin.vouchers.confirmDelete"))) return
    try {
      await adminFetch(`/api/admin/server/experience-vouchers/${voucher.id}`, {
        method: "DELETE",
      })
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const exportCsv = () => {
    if (!vouchers?.length) return
    const header = ["Code", "Status", "Booking ID", "Used at", "Remark"]
    const rows = vouchers.map((voucher) => [
      voucher.code,
      voucher.status === 1 ? "used" : voucher.status === 2 ? "disabled" : "unused",
      voucher.usedBookingId ?? "",
      voucher.usedAt ?? "",
      voucher.remark ?? "",
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n")
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "health-check-vouchers.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title={t("admin.vouchers.title")} description={t("admin.vouchers.desc")} />

      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
          <div className="border-b border-ikea-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">{t("admin.vouchers.listTitle")}</h2>
            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void load()
                }}
                placeholder={t("admin.vouchers.placeholderSearch")}
                className="h-9 w-full rounded-md border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue md:max-w-xs"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
              >
                <option value="">{t("admin.vouchers.allStatuses")}</option>
                <option value="0">{t("admin.vouchers.statusUnused")}</option>
                <option value="1">{t("admin.vouchers.statusUsed")}</option>
                <option value="2">{t("admin.vouchers.statusDisabled")}</option>
              </select>
              <Button variant="secondary" onClick={() => void load()}>
                {t("admin.vouchers.search")}
              </Button>
              <Button variant="secondary" onClick={exportCsv}>
                {t("admin.vouchers.exportCsv")}
              </Button>
            </div>
          </div>
          {!vouchers ? (
            <Loading />
          ) : vouchers.length === 0 ? (
            <EmptyState>{t("admin.vouchers.empty")}</EmptyState>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colCode")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colStatus")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colBooking")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colRemark")}</th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t("admin.common.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ikea-gray-200">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-ikea-gray-50">
                    <td className="px-5 py-3 font-medium">{voucher.code}</td>
                    <td className="px-5 py-3">{t(statusLabelKey(voucher.status))}</td>
                    <td className="px-5 py-3">{voucher.usedBookingId ?? "—"}</td>
                    <td className="px-5 py-3">{voucher.remark || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" onClick={() => startEdit(voucher)}>
                        {t("admin.vouchers.edit")}
                      </Button>{" "}
                      {voucher.status === 1 ? null : (
                        <>
                          <Button variant="secondary" onClick={() => void toggleVoucher(voucher)}>
                            {voucher.status === 2
                              ? t("admin.vouchers.enable")
                              : t("admin.vouchers.disable")}
                          </Button>{" "}
                        </>
                      )}
                      <Button variant="danger" onClick={() => void deleteVoucher(voucher)}>
                        {t("admin.vouchers.delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {editing ? (
          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">{t("admin.vouchers.editTitle")}</h2>
            <p className="mt-1 text-xs leading-5 text-ikea-muted">{editing.code}</p>
            <div className="mt-4 space-y-3">
              <TextInput
                value={editRemark}
                onChange={(event) => setEditRemark(event.target.value)}
                placeholder={t("admin.vouchers.remarkPlaceholder")}
              />
              <div className="flex gap-2">
                <Button onClick={() => void saveVoucher()}>{t("admin.vouchers.save")}</Button>
                <Button variant="secondary" onClick={cancelEdit}>
                  {t("admin.vouchers.cancel")}
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">{t("admin.vouchers.enterTitle")}</h2>
            <p className="mt-1 text-xs leading-5 text-ikea-muted">
              {t("admin.vouchers.enterDesc")}
            </p>
            <div className="mt-4 space-y-3">
              <TextArea
                rows={10}
                value={codes}
                onChange={(event) => setCodes(event.target.value)}
                placeholder={t("admin.vouchers.codesPlaceholder")}
              />
              <TextInput
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder={t("admin.vouchers.remarkPlaceholder")}
              />
              <Button onClick={() => void createVouchers()}>{t("admin.vouchers.create")}</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
