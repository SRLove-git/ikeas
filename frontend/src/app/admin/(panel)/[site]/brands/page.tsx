"use client"

import { useCallback, useEffect, useState } from "react"
import {
  adminFetch,
  Button,
  Card,
  ConfirmButton,
  EmptyState,
  Field,
  Loading,
  NoticeArea,
  NumberInput,
  PageHeader,
  Pagination,
  SearchBox,
  Select,
  TextInput,
  cn,
  useNotice,
} from "@/components/admin/admin-ui"
import { formatPrice } from "@/lib/catalog-format"

type Brand = "toshiba" | "midea"

interface BrandProduct {
  id: string
  slug: string
  model: string
  name: string
  price: number | null
  originalPrice: number | null
  image: string | null
  detail: {
    capacity?: string | null
    dimension: string | null
    energy?: string | null
  }
}

interface Draft {
  name: string
  price: string
  originalPrice: string
  capacity: string
  dimension: string
  energy: string
}

interface BrandCategory {
  slug: string
  name: string
  subs: { slug: string; name: string }[]
}

interface OmsMapping {
  productId: string
  omsSkuId: number
  omsSkuNo: string | null
  syncPrice: number | null
  syncStock: number | null
  lastSyncAt: string | null
}

interface OmsDraft {
  omsSkuId: string
  omsSkuNo: string
}

const EMPTY_FORM = {
  model: "",
  name: "",
  categorySlug: "",
  subSlug: "",
  price: "",
  originalPrice: "",
  capacity: "",
  dimension: "",
  energy: "",
  image: "",
}

const BRANDS: { id: Brand; label: string }[] = [
  { id: "toshiba", label: "东芝 Toshiba" },
  { id: "midea", label: "美的 Midea" },
]

function toDraft(item: BrandProduct): Draft {
  return {
    name: item.name,
    price: item.price === null ? "" : String(item.price),
    originalPrice: item.originalPrice === null ? "" : String(item.originalPrice),
    capacity: item.detail.capacity ?? "",
    dimension: item.detail.dimension ?? "",
    energy: item.detail.energy ?? "",
  }
}

export default function BrandProductsPage() {
  const [brand, setBrand] = useState<Brand>("toshiba")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: BrandProduct[]; total: number } | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [savingSlug, setSavingSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { notice, show } = useNotice()
  const [categories, setCategories] = useState<BrandCategory[]>([])
  const [creating, setCreating] = useState(false)
  const [savingNew, setSavingNew] = useState(false)
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null)
  const [uploadingNew, setUploadingNew] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [mappings, setMappings] = useState<Record<string, OmsMapping>>({})
  const [mappingDrafts, setMappingDrafts] = useState<Record<string, OmsDraft>>({})
  const [savingMappingId, setSavingMappingId] = useState<string | null>(null)
  const pageSize = 20

  const load = useCallback(async () => {
    try {
      const result = await adminFetch<{ items: BrandProduct[]; total: number }>(
        `/api/admin/brand-products?brand=${brand}&q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
      )
      setData(result)
      setDrafts((prev) => {
        const next: Record<string, Draft> = {}
        for (const item of result.items) next[item.slug] = prev[item.slug] ?? toDraft(item)
        return next
      })
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [brand, query, page])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 200)
    return () => window.clearTimeout(timer)
  }, [load])

  useEffect(() => {
    void (async () => {
      try {
        const result = await adminFetch<{ items: BrandCategory[] }>(
          `/api/admin/brand-categories?brand=${brand}`,
        )
        setCategories(result.items)
      } catch (e) {
        setError((e as Error).message)
      }
    })()
  }, [brand])

  const loadMappings = useCallback(async () => {
    try {
      const result = await adminFetch<{ items: OmsMapping[] }>("/api/admin/server/oms/sku-mappings")
      const next = Object.fromEntries(result.items.map((item) => [item.productId, item]))
      setMappings(next)
      setMappingDrafts((previous) => {
        const drafts = { ...previous }
        for (const item of result.items) {
          drafts[item.productId] = {
            omsSkuId: String(item.omsSkuId),
            omsSkuNo: item.omsSkuNo ?? "",
          }
        }
        return drafts
      })
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void loadMappings()
  }, [loadMappings])

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/admin/server/oss/upload", {
      method: "POST",
      body: formData,
    })
    const body = (await response.json().catch(() => null)) as {
      url?: string
      error?: string
    } | null
    if (!response.ok || !body?.url) {
      throw new Error(body?.error ?? `上传失败 (${response.status})`)
    }
    return body.url
  }

  const uploadForRow = async (item: BrandProduct, file: File) => {
    setUploadingSlug(item.slug)
    try {
      const url = await uploadFile(file)
      await adminFetch(`/api/admin/brand-products/${brand}/${encodeURIComponent(item.slug)}`, {
        method: "PATCH",
        body: JSON.stringify({ image: url }),
      })
      show("success", `${item.model} 主图已更新`)
      await load()
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setUploadingSlug(null)
    }
  }

  const uploadForForm = async (file: File) => {
    setUploadingNew(true)
    try {
      const url = await uploadFile(file)
      setForm((prev) => ({ ...prev, image: url }))
      show("success", "图片已上传")
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setUploadingNew(false)
    }
  }

  const submitNew = async () => {
    setSavingNew(true)
    try {
      await adminFetch("/api/admin/brand-products", {
        method: "POST",
        body: JSON.stringify({ brand, ...form }),
      })
      show("success", `已新增 ${form.model}`)
      setForm({ ...EMPTY_FORM })
      setCreating(false)
      setPage(1)
      await load()
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSavingNew(false)
    }
  }

  const remove = async (item: BrandProduct) => {
    try {
      await adminFetch(`/api/admin/brand-products/${brand}/${encodeURIComponent(item.slug)}`, {
        method: "DELETE",
      })
      show("success", `已删除 ${item.model}`)
      await load()
    } catch (e) {
      show("error", (e as Error).message)
    }
  }

  const patchDraft = (slug: string, key: keyof Draft, value: string) => {
    setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: value } }))
  }

  const save = async (item: BrandProduct) => {
    const draft = drafts[item.slug]
    if (!draft) return
    setSavingSlug(item.slug)
    try {
      await adminFetch(`/api/admin/brand-products/${brand}/${encodeURIComponent(item.slug)}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: draft.name,
          price: draft.price,
          originalPrice: draft.originalPrice,
          capacity: draft.capacity,
          dimension: draft.dimension,
          energy: draft.energy,
        }),
      })
      show("success", `已保存 ${item.model}`)
      await load()
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSavingSlug(null)
    }
  }

  const patchMappingDraft = (productId: string, key: keyof OmsDraft, value: string) => {
    setMappingDrafts((previous) => ({
      ...previous,
      [productId]: {
        omsSkuId: previous[productId]?.omsSkuId ?? "",
        omsSkuNo: previous[productId]?.omsSkuNo ?? "",
        [key]: value,
      },
    }))
  }

  const saveMapping = async (item: BrandProduct) => {
    const draft = mappingDrafts[item.id] ?? { omsSkuId: "", omsSkuNo: item.model }
    const omsSkuId = Number(draft.omsSkuId)
    if (!Number.isSafeInteger(omsSkuId) || omsSkuId <= 0) {
      show("error", "OMS SKU ID 必须是正整数")
      return
    }
    setSavingMappingId(item.id)
    try {
      await adminFetch("/api/admin/server/oms/sku-mappings", {
        method: "POST",
        body: JSON.stringify({
          productId: item.id,
          omsSkuId,
          omsSkuNo: draft.omsSkuNo.trim() || null,
        }),
      })
      show("success", `${item.model} 已配置 OMS SKU`)
      await loadMappings()
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSavingMappingId(null)
    }
  }

  const removeMapping = async (item: BrandProduct) => {
    setSavingMappingId(item.id)
    try {
      await adminFetch(`/api/admin/server/oms/sku-mappings/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      })
      setMappingDrafts((previous) => ({
        ...previous,
        [item.id]: { omsSkuId: "", omsSkuNo: item.model },
      }))
      show("success", `${item.model} 已解除 OMS SKU 映射`)
      await loadMappings()
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSavingMappingId(null)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="品牌目录（东芝 / 美的）"
        description="维护品牌商品、销售价格与 OMS SKU。配置有效售价和 OMS SKU 后，商品才可进入结账。"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {BRANDS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setBrand(option.id)
              setPage(1)
              setDrafts({})
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-bold transition",
              brand === option.id
                ? "bg-blue-950 text-white"
                : "bg-white text-ikea-black ring-1 ring-ikea-gray-200 hover:ring-ikea-black",
            )}
          >
            {option.label}
          </button>
        ))}
        <Button variant="primary" className="ml-2" onClick={() => setCreating((prev) => !prev)}>
          {creating ? "取消新增" : "+ 新增商品"}
        </Button>
        <div className="ml-auto w-64">
          <SearchBox
            value={query}
            onChange={(value) => {
              setQuery(value)
              setPage(1)
            }}
            placeholder="搜索型号 / 名称"
          />
        </div>
      </div>

      {creating ? (
        <Card className="mt-4 p-4">
          <p className="mb-3 text-sm font-bold">
            新增{BRANDS.find((b) => b.id === brand)?.label}商品
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="型号 *">
              <TextInput
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                placeholder="如 MDRT580MTB46-SG"
              />
            </Field>
            <Field label="名称 *">
              <TextInput
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="如 Midea Top Mount Freezer"
              />
            </Field>
            <Field label="品类 *">
              <Select
                value={form.categorySlug}
                onChange={(event) =>
                  setForm({ ...form, categorySlug: event.target.value, subSlug: "" })
                }
              >
                <option value="">请选择</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="子类 *">
              <Select
                value={form.subSlug}
                onChange={(event) => setForm({ ...form, subSlug: event.target.value })}
                disabled={!form.categorySlug}
              >
                <option value="">请选择</option>
                {(
                  categories.find((category) => category.slug === form.categorySlug)?.subs ?? []
                ).map((sub) => (
                  <option key={sub.slug} value={sub.slug}>
                    {sub.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="售价（SGD）">
              <NumberInput
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
              />
            </Field>
            <Field label="划线价（SGD）">
              <NumberInput
                value={form.originalPrice}
                onChange={(event) => setForm({ ...form, originalPrice: event.target.value })}
              />
            </Field>
            <Field label="容量">
              <TextInput
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                placeholder="如 25 L"
              />
            </Field>
            <Field label="尺寸">
              <TextInput
                value={form.dimension}
                onChange={(event) => setForm({ ...form, dimension: event.target.value })}
                placeholder="宽×深×高"
              />
            </Field>
            <Field label="能效">
              <TextInput
                value={form.energy}
                onChange={(event) => setForm({ ...form, energy: event.target.value })}
                placeholder="如 3 tick"
              />
            </Field>
            <Field
              label="主图"
              className="md:col-span-3"
              hint="可以直接上传，也可以粘贴已有的 OSS 地址"
            >
              <div className="flex items-start gap-3">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image}
                    alt="主图预览"
                    className="h-16 w-16 rounded border border-ikea-gray-200 object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 rounded bg-ikea-gray-100" />
                )}
                <div className="flex-1">
                  <TextInput
                    value={form.image}
                    onChange={(event) => setForm({ ...form, image: event.target.value })}
                    placeholder="https://medical-sg.oss-ap-southeast-1.aliyuncs.com/images/products/..."
                  />
                </div>
                <div>
                  <label
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center rounded px-3 text-sm font-bold text-white",
                      uploadingNew ? "bg-ikea-gray-400" : "bg-ikea-blue",
                    )}
                  >
                    {uploadingNew ? "上传中…" : "上传图片"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingNew}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ""
                        if (file) void uploadForForm(file)
                      }}
                    />
                  </label>
                </div>
              </div>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => void submitNew()} disabled={savingNew}>
              {savingNew ? "提交中…" : "确认新增"}
            </Button>
            <Button onClick={() => setCreating(false)}>取消</Button>
          </div>
        </Card>
      ) : null}

      <NoticeArea notice={notice} />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <Card className="mt-4 overflow-x-auto">
        {!data ? (
          <Loading label="加载中" />
        ) : data.items.length === 0 ? (
          <EmptyState>没有匹配的商品</EmptyState>
        ) : (
          <table className="w-full min-w-[1460px] text-sm">
            <thead>
              <tr className="border-b border-ikea-gray-200 text-left text-xs text-ikea-muted">
                <th className="px-3 py-2">图片</th>
                <th className="px-3 py-2">型号</th>
                <th className="px-3 py-2">名称</th>
                <th className="px-3 py-2">售价</th>
                <th className="px-3 py-2">划线价</th>
                <th className="px-3 py-2">容量</th>
                <th className="px-3 py-2">尺寸</th>
                <th className="px-3 py-2">能效</th>
                <th className="px-3 py-2">OMS SKU ID</th>
                <th className="px-3 py-2">OMS SKU 编号</th>
                <th className="px-3 py-2">销售状态</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const draft = drafts[item.slug] ?? toDraft(item)
                const mapping = mappings[item.id]
                const mappingDraft = mappingDrafts[item.id] ?? {
                  omsSkuId: mapping ? String(mapping.omsSkuId) : "",
                  omsSkuNo: mapping?.omsSkuNo ?? item.model,
                }
                return (
                  <tr key={item.slug} className="border-b border-ikea-gray-100 align-top">
                    <td className="px-3 py-2">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.model}
                          className="h-12 w-12 rounded border border-ikea-gray-200 object-contain"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-ikea-gray-100" />
                      )}
                      <label className="mt-1 block cursor-pointer text-[11px] text-blue-700 hover:underline">
                        {uploadingSlug === item.slug ? "上传中…" : "换图"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingSlug === item.slug}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.target.value = ""
                            if (file) void uploadForRow(item, file)
                          }}
                        />
                      </label>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{item.model}</td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={draft.name}
                        onChange={(event) => patchDraft(item.slug, "name", event.target.value)}
                        className="w-48"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
                        value={draft.price}
                        onChange={(event) => patchDraft(item.slug, "price", event.target.value)}
                        className="w-24"
                      />
                      <p className="mt-1 text-[11px] text-ikea-muted">{formatPrice(item.price)}</p>
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
                        value={draft.originalPrice}
                        onChange={(event) =>
                          patchDraft(item.slug, "originalPrice", event.target.value)
                        }
                        className="w-24"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={draft.capacity}
                        onChange={(event) => patchDraft(item.slug, "capacity", event.target.value)}
                        className="w-24"
                        placeholder="如 25 L"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={draft.dimension}
                        onChange={(event) => patchDraft(item.slug, "dimension", event.target.value)}
                        className="w-40"
                        placeholder="宽×深×高"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={draft.energy}
                        onChange={(event) => patchDraft(item.slug, "energy", event.target.value)}
                        className="w-20"
                        placeholder="3 tick"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <NumberInput
                        value={mappingDraft.omsSkuId}
                        onChange={(event) =>
                          patchMappingDraft(item.id, "omsSkuId", event.target.value)
                        }
                        className="w-28"
                        placeholder="10001"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TextInput
                        value={mappingDraft.omsSkuNo}
                        onChange={(event) =>
                          patchMappingDraft(item.id, "omsSkuNo", event.target.value)
                        }
                        className="w-36"
                        placeholder={item.model}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {mapping &&
                      mapping.lastSyncAt &&
                      mapping.syncPrice !== null &&
                      mapping.syncPrice > 0 &&
                      mapping.syncStock !== null &&
                      mapping.syncStock > 0 ? (
                        <div>
                          <span className="font-bold text-green-700">可销售</span>
                          <p className="mt-1 text-[11px] text-ikea-muted">
                            OMS S${mapping.syncPrice.toFixed(2)} · 库存 {mapping.syncStock}
                          </p>
                        </div>
                      ) : (
                        <span className="font-bold text-amber-700">
                          {!mapping
                            ? "未映射 OMS"
                            : !mapping.lastSyncAt ||
                                mapping.syncPrice === null ||
                                mapping.syncStock === null
                              ? "等待 OMS 验证"
                              : mapping.syncPrice <= 0
                                ? "OMS 售价无效"
                                : "OMS 库存为 0"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void save(item)} disabled={savingSlug === item.slug}>
                          {savingSlug === item.slug ? "保存中…" : "保存"}
                        </Button>
                        <Button
                          onClick={() => void saveMapping(item)}
                          disabled={savingMappingId === item.id}
                        >
                          {savingMappingId === item.id ? "同步中…" : "保存 OMS"}
                        </Button>
                        {mapping ? (
                          <ConfirmButton onConfirm={() => removeMapping(item)}>
                            解除 OMS
                          </ConfirmButton>
                        ) : null}
                        <ConfirmButton onConfirm={() => remove(item)}>删除</ConfirmButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.total > pageSize ? (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            onChange={(next: number) => setPage(next)}
          />
        </div>
      ) : null}
    </div>
  )
}
