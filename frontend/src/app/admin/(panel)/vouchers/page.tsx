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
  TextInput,
} from "@/components/admin/admin-ui"

interface HealthCheckVoucher {
  id: string
  code: string
  type: number
  status: number
  validUntil?: string | null
  batchNo?: string | null
  orderNo?: string | null
  usedBookingId?: string | null
  usedAt?: string | null
  remark?: string | null
  createdAt: string
}

function statusLabelKey(status: number): string {
  if (status === 1) return "admin.vouchers.statusUsed"
  if (status === 2) return "admin.vouchers.statusDisabled"
  if (status === 3) return "admin.vouchers.statusInvalid"
  return "admin.vouchers.statusUnused"
}

function typeLabelKey(type: number): string {
  return type === 2 ? "admin.vouchers.typePoints" : "admin.vouchers.typeExperience"
}

export default function VouchersPage() {
  const { t } = useTranslation()
  const [vouchers, setVouchers] = useState<HealthCheckVoucher[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [batchCount, setBatchCount] = useState("100")
  const [batchType, setBatchType] = useState("2")
  const [batchValidUntil, setBatchValidUntil] = useState("")
  const [batchBatchNo, setBatchBatchNo] = useState("")
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [editing, setEditing] = useState<HealthCheckVoucher | null>(null)
  const [editRemark, setEditRemark] = useState("")

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("q", query.trim())
      if (statusFilter) params.set("status", statusFilter)
      if (typeFilter) params.set("type", typeFilter)
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
          setSelected([])
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

  const generateVouchers = async () => {
    try {
      const count = Number(batchCount)
      if (!Number.isInteger(count) || count <= 0 || count > 1000) {
        setError(t("admin.vouchers.invalidCount"))
        return
      }
      await adminFetch("/api/admin/server/experience-vouchers/generate", {
        method: "POST",
        body: JSON.stringify({
          count,
          type: Number(batchType),
          validUntil: batchValidUntil || null,
          batchNo: batchBatchNo.trim() || null,
        }),
      })
      setBatchBatchNo("")
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const toggleSelected = (code: string) => {
    setSelected((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    )
  }

  const downloadPdf = async () => {
    try {
      const targets = selected.length ? selected : vouchers?.slice(0, 100).map((v) => v.code) ?? []
      if (!targets.length) {
        setError(t("admin.vouchers.emptyInput"))
        return
      }
      setGeneratingPdf(true)
      const response = await fetch("/api/admin/server/experience-vouchers/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: targets }),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Request failed (${response.status})`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const disposition = response.headers.get("content-disposition") ?? ""
      const match = /filename="?([^"]+)"?/.exec(disposition)
      link.href = url
      link.download = match?.[1] ?? "vouchers.pdf"
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGeneratingPdf(false)
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
    const header = ["Code", "Type", "Status", "Booking ID", "Order No", "Used at", "Remark"]
    const rows = vouchers.map((voucher) => [
      voucher.code,
      voucher.type === 2 ? "points" : "experience",
      voucher.status === 1 ? "used" : voucher.status === 2 ? "disabled" : "unused",
      voucher.usedBookingId ?? "",
      voucher.orderNo ?? "",
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
                <option value="3">{t("admin.vouchers.statusInvalid")}</option>
              </select>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-9 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
              >
                <option value="">{t("admin.vouchers.allTypes")}</option>
                <option value="1">{t("admin.vouchers.typeExperience")}</option>
                <option value="2">{t("admin.vouchers.typePoints")}</option>
              </select>
              <Button variant="secondary" onClick={() => void load()}>
                {t("admin.vouchers.search")}
              </Button>
              <Button variant="secondary" disabled={generatingPdf} onClick={() => void downloadPdf()}>
                {generatingPdf ? t("admin.vouchers.generatingPdf") : t("admin.vouchers.downloadPdf")}
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
                  <th className="px-4 py-3 font-medium">{t("admin.vouchers.colSelect")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colCode")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colType")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colStatus")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colBooking")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colOrder")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.vouchers.colRemark")}</th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t("admin.common.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ikea-gray-200">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-ikea-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(voucher.code)}
                        onChange={() => toggleSelected(voucher.code)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-5 py-3 font-medium">{voucher.code}</td>
                    <td className="px-5 py-3">{t(typeLabelKey(voucher.type))}</td>
                    <td className="px-5 py-3">{t(statusLabelKey(voucher.status))}</td>
                    <td className="px-5 py-3">{voucher.usedBookingId ?? "—"}</td>
                    <td className="px-5 py-3">{voucher.orderNo ?? "—"}</td>
                    <td className="px-5 py-3">{voucher.remark || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" onClick={() => startEdit(voucher)}>
                        {t("admin.vouchers.edit")}
                      </Button>{" "}
                      {voucher.status === 1 || voucher.status === 3 ? null : (
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
            <h2 className="text-base font-bold">{t("admin.vouchers.batchGenerateTitle")}</h2>
            <p className="mt-1 text-xs leading-5 text-ikea-muted">
              {t("admin.vouchers.batchGenerateDesc")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TextInput
                type="number"
                min="1"
                max="1000"
                value={batchCount}
                onChange={(event) => setBatchCount(event.target.value)}
                placeholder={t("admin.vouchers.batchCountPlaceholder")}
              />
              <select
                value={batchType}
                onChange={(event) => setBatchType(event.target.value)}
                className="h-9 rounded-md border border-ikea-gray-200 bg-white px-3 text-sm outline-none focus:border-ikea-blue"
              >
                <option value="1">{t("admin.vouchers.typeExperience")}</option>
                <option value="2">{t("admin.vouchers.typePoints")}</option>
              </select>
              <TextInput
                type="date"
                value={batchValidUntil}
                onChange={(event) => setBatchValidUntil(event.target.value)}
                placeholder={t("admin.vouchers.validUntilPlaceholder")}
              />
              <TextInput
                value={batchBatchNo}
                onChange={(event) => setBatchBatchNo(event.target.value)}
                placeholder={t("admin.vouchers.batchNoPlaceholder")}
              />
            </div>
            <Button className="mt-3" onClick={() => void generateVouchers()}>
              {t("admin.vouchers.batchGenerate")}
            </Button>
          </section>
        )}
      </div>
    </div>
  )
}
