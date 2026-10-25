"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import {
  AlertCircle,
  Check,
  ChevronRight,
  CircleCheck,
  ImagePlus,
  MessageCircle,
  PackageCheck,
  Plus,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
  Video,
} from "lucide-react"
import {
  adminFetch,
  BackLink,
  Button,
  Card,
  ConfirmButton,
  Field,
  JsonEditor,
  Loading,
  NoticeArea,
  NumberInput,
  PageHeader,
  StringListEditor,
  TextArea,
  TextInput,
  cn,
  useNotice,
} from "@/components/admin/admin-ui"
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms"
import { SiteImage } from "@/components/SiteImage"

interface ProductForm {
  id: string
  slug: string
  name: string
  productType?: string | null
  designText?: string | null
  price?: number | null
  originalPrice?: number | null
  image?: string | null
  labels: Record<string, unknown>[]
  detail: {
    images: string[]
    benefits: string[]
    dimension?: string | null
    materials: string[]
    care: string[]
    description?: string | null
  }
}

function emptyProduct(): ProductForm {
  return {
    id: "",
    slug: "",
    name: "",
    productType: null,
    designText: null,
    price: null,
    originalPrice: null,
    image: null,
    labels: [],
    detail: {
      images: [],
      benefits: [],
      dimension: null,
      materials: [],
      care: [],
      description: null,
    },
  }
}

function WorkspaceSection({
  id,
  title,
  subtitle,
  children,
}: {
  id: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-xl border border-[#e6e8eb] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <header className="border-b border-[#eef0f2] px-6 py-5">
        <h2 className="text-lg font-semibold text-[#262b33]">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs leading-5 text-[#8b929d]">{subtitle}</p> : null}
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

function ImageUrlGallery({
  cover,
  images,
  productName,
  onCoverChange,
  onImagesChange,
  labels,
}: {
  cover: string
  images: string[]
  productName: string
  onCoverChange: (value: string) => void
  onImagesChange: (value: string[]) => void
  labels: { cover: string; add: string; imageUrl: string; remove: string }
}) {
  return (
    <div className="space-y-5">
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="w-[108px] shrink-0">
          <div className="relative h-[108px] overflow-hidden rounded-lg border-2 border-[#ee4d2d] bg-[#fafafa]">
            {cover ? (
              <SiteImage src={cover} alt={productName} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-[#ee4d2d]">
                <ImagePlus className="h-7 w-7" strokeWidth={1.7} />
                <span className="text-xs">{labels.imageUrl}</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-[#ee4d2d] py-1 text-center text-[11px] font-medium text-white">
              {labels.cover}
            </div>
          </div>
        </div>
        {images.map((image, index) => (
          <div key={index} className="group relative h-[108px] w-[108px] shrink-0">
            <div className="h-full overflow-hidden rounded-lg border border-[#dfe2e6] bg-[#fafafa]">
              {image ? (
                <SiteImage
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#c1c6cd]">
                  <ImagePlus className="h-7 w-7" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onImagesChange(images.filter((_, itemIndex) => itemIndex !== index))}
              className="absolute right-1.5 top-1.5 hidden h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#6b7280] shadow group-hover:flex hover:text-red-600"
              aria-label={labels.remove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onImagesChange([...images, ""])}
          className="flex h-[108px] w-[108px] shrink-0 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#cfd3d8] text-[#ee4d2d] transition hover:border-[#ee4d2d] hover:bg-[#fff8f6]"
        >
          <Plus className="h-7 w-7" strokeWidth={1.7} />
          <span className="text-xs font-medium">{labels.add}</span>
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Field label={`${labels.cover} URL`}>
          <TextInput value={cover} onChange={(event) => onCoverChange(event.target.value)} />
        </Field>
        {images.map((image, index) => (
          <Field key={index} label={`${labels.imageUrl} ${index + 1}`}>
            <div className="flex gap-2">
              <TextInput
                value={image}
                onChange={(event) => {
                  const next = [...images]
                  next[index] = event.target.value
                  onImagesChange(next)
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-2.5"
                onClick={() => onImagesChange(images.filter((_, itemIndex) => itemIndex !== index))}
                aria-label={labels.remove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Field>
        ))}
      </div>
    </div>
  )
}

function ProductPreview({
  form,
  copy,
}: {
  form: ProductForm
  copy: { title: string; detail: string; sold: string; buyNow: string; reference: string }
}) {
  const previewImage = form.image || form.detail.images.find(Boolean) || ""
  return (
    <aside className="hidden self-start xl:block">
      <div className="rounded-xl border border-[#e3e5e8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <h2 className="text-lg font-semibold text-[#30343b]">{copy.title}</h2>
        <p className="mt-4 text-sm text-[#626975]">{copy.detail}</p>
        <div className="mt-5 overflow-hidden rounded-lg border border-[#e4e6e9] bg-white">
          <div className="relative aspect-square bg-[#fafafa]">
            <SiteImage src={previewImage} alt={form.name} className="h-full w-full" />
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
              1/{Math.max(1, form.detail.images.filter(Boolean).length + (form.image ? 1 : 0))}
            </span>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xl font-semibold text-[#ee4d2d]">
                {form.price == null ? "S$ --" : `S$${form.price.toFixed(2)}`}
              </p>
              <span className="text-xs text-[#8b929d]">{copy.sold}</span>
            </div>
            <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[#30343b]">
              {form.name || "—"}
            </h3>
            <div className="flex items-center gap-2 border-t border-[#edf0f2] pt-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecf8f8] text-[#16a6a1]">
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#353a42]">BUZUD MEDICAL</p>
                <p className="truncate text-[10px] text-[#9aa0a9]">
                  {form.productType || "Medical & Wellness"}
                </p>
              </div>
              <button
                type="button"
                className="rounded border border-[#ee4d2d] px-2 py-1 text-[10px] text-[#ee4d2d]"
              >
                Visit
              </button>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1.5fr] border-t border-[#e5e7eb]">
            <button
              type="button"
              className="flex h-11 items-center justify-center bg-[#26b6ad] text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center bg-[#20a9a1] text-white"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
            <button type="button" className="h-11 bg-[#ee4d2d] text-sm font-medium text-white">
              {copy.buyNow}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#9aa0a9]">{copy.reference}</p>
      </div>
    </aside>
  )
}

export default function ProductEditorPage() {
  const { t, i18n } = useTranslation()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = params.id === "new"
  const isChinese = i18n.language.toLowerCase().startsWith("zh")
  const tr = (zh: string, en: string) => (isChinese ? zh : en)
  const LABEL_SCHEMA: Schema = {
    fields: [
      { key: "text", label: t("admin.products.labelText"), kind: { type: "text" } },
      { key: "backgroundColor", label: t("admin.products.labelBg"), kind: { type: "text" } },
      { key: "textColor", label: t("admin.products.labelTextColor"), kind: { type: "text" } },
    ],
  }
  const { notice, show } = useNotice()
  const [form, setForm] = useState<ProductForm>(emptyProduct())
  const [rawMode, setRawMode] = useState(false)
  const [raw, setRaw] = useState<unknown>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ name: string; href: string }[]>([])

  useEffect(() => {
    if (isNew) return
    void (async () => {
      try {
        const product = await adminFetch<Record<string, unknown>>(
          `/api/admin/products/${params.id}`,
        )
        setCategories((product.categories as { name: string; href: string }[] | undefined) ?? [])
        delete product.categories
        setForm(product as unknown as ProductForm)
        setRaw(product)
      } catch (error) {
        show("error", (error as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isNew, params.id, show])

  const update = (patch: Partial<ProductForm>) => setForm((current) => ({ ...current, ...patch }))
  const updateDetail = (patch: Partial<ProductForm["detail"]>) =>
    setForm((current) => ({ ...current, detail: { ...current.detail, ...patch } }))
  const previewUrl = useMemo(
    () => (form.slug?.trim() ? `/zh/p/${form.slug.trim()}/` : null),
    [form.slug],
  )
  const completeness = useMemo(() => {
    const checks = [
      Boolean(form.name.trim()),
      Boolean(form.slug.trim()),
      Boolean(form.image || form.detail.images.some(Boolean)),
      form.price != null,
      Boolean(form.productType),
      Boolean(form.detail.description || form.detail.benefits.length),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [form])

  const save = async () => {
    setSaving(true)
    try {
      const payload = rawMode ? raw : form
      if (isNew) {
        await adminFetch("/api/admin/products", { method: "POST", body: JSON.stringify(payload) })
        show("success", t("admin.products.created"))
        router.replace("/admin/products")
      } else {
        await adminFetch(`/api/admin/products/${params.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        show("success", t("admin.products.saved"))
      }
    } catch (error) {
      show("error", (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/products/${params.id}`, { method: "DELETE" })
      show("success", t("admin.products.deleted"))
      router.replace("/admin/products")
    } catch (error) {
      show("error", (error as Error).message)
    }
  }

  if (loading) return <Loading />

  const tabs = [
    { id: "basic", label: tr("基本信息", "Basic Information") },
    { id: "attributes", label: tr("商品属性", "Attributes") },
    { id: "description", label: "Description" },
    { id: "sales", label: tr("销售资料", "Sales") },
    { id: "shipping", label: tr("运费", "Shipping") },
    { id: "marketing", label: "Marketing" },
    { id: "other", label: tr("其他", "Other") },
  ]

  return (
    <div className="-mx-3 -mt-2 pb-4 2xl:-mx-4">
      <BackLink href="/admin/products" label={t("admin.products.backToList")} />
      <PageHeader
        title={isNew ? t("admin.products.newTitle") : form.name || t("admin.products.newTitle")}
        description={isNew ? t("admin.products.newDesc") : `ID: ${params.id}`}
        actions={
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-[#e8f8f0] px-3 py-1 text-xs font-medium text-[#16855b] sm:inline-flex sm:items-center sm:gap-1.5">
              <CircleCheck className="h-3.5 w-3.5" /> {tr("已加载商品", "Product loaded")}
            </span>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">{t("admin.products.preview")} ↗</Button>
              </a>
            ) : null}
          </div>
        }
      />
      <NoticeArea notice={notice} />

      <nav className="sticky top-[53px] z-20 mb-5 overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white px-2 shadow-sm">
        <div className="flex min-w-max">
          {tabs.map((tab, index) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className={cn(
                "relative px-5 py-4 text-sm font-medium text-[#535a65] transition hover:text-[#ee4d2d]",
                index === 0 &&
                  "text-[#ee4d2d] after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-[#ee4d2d]",
              )}
            >
              {tab.label}
            </a>
          ))}
          <div className="ml-auto flex items-center gap-2 px-3">
            <span className="text-xs text-[#8b929d]">{t("admin.products.editMode")}</span>
            <button
              type="button"
              onClick={() => setRawMode(false)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium",
                !rawMode ? "bg-[#fff0ec] text-[#ee4d2d]" : "text-[#6f7680] hover:bg-[#f4f5f6]",
              )}
            >
              {t("admin.products.formEdit")}
            </button>
            <button
              type="button"
              onClick={() => {
                setRaw(form)
                setRawMode(true)
              }}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium",
                rawMode ? "bg-[#fff0ec] text-[#ee4d2d]" : "text-[#6f7680] hover:bg-[#f4f5f6]",
              )}
            >
              {t("admin.products.rawJson")}
            </button>
          </div>
        </div>
      </nav>

      {rawMode ? (
        <Card title={t("admin.products.rawCard")} className="mb-24">
          <JsonEditor value={raw ?? form} onChange={setRaw} rows={30} />
        </Card>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[230px_minmax(0,1fr)_300px]">
          <aside className="sticky top-[116px] hidden self-start xl:block">
            <div className="overflow-hidden rounded-xl border border-[#e2e5e8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="border-t-4 border-[#287be0] bg-[#eef6ff] p-5">
                <div className="flex items-center gap-2 text-base font-semibold text-[#303641]">
                  <Sparkles className="h-4 w-4 text-[#287be0]" /> Product Optimiser
                </div>
                <p className="mt-2 text-xs leading-5 text-[#7e8793]">
                  {tr(
                    "完善商品信息，提高买家的下单意愿。",
                    "Complete product information to improve conversion.",
                  )}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="font-medium text-[#14a497]">Basic Traffic</span>
                  <span className="font-semibold text-[#3f4854]">{completeness}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-[#20b3a4] transition-all"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#ee4d2d]">
                  {tr("待优化项", "Tasks to improve")}
                </h3>
                <div className="mt-3 space-y-1">
                  {[
                    [
                      Boolean(form.image || form.detail.images.some(Boolean)),
                      tr("上传清晰商品图", "Add clear images"),
                    ],
                    [Boolean(form.detail.description), tr("补充商品描述", "Add a description")],
                    [form.detail.benefits.length > 0, tr("填写商品亮点", "Add key benefits")],
                    [false, tr("添加商品视频", "Upload a product video")],
                  ].map(([complete, label]) => (
                    <div
                      key={String(label)}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-[#5e6570]"
                    >
                      {complete ? (
                        <Check className="h-4 w-4 rounded-full bg-[#dcf5ed] p-0.5 text-[#15966f]" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-[#c9cdd3]" />
                      )}
                      <span className={complete ? "text-[#9aa0a8] line-through" : ""}>
                        {String(label)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="min-w-0 space-y-5 pb-24">
            <WorkspaceSection
              id="basic"
              title={tr("基本信息", "Basic Information")}
              subtitle={tr(
                "完整、准确的基础信息将同步展示给买家。",
                "Complete and accurate information is shown to buyers.",
              )}
            >
              <div className="space-y-7">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#343941]">
                      <span className="mr-1 text-[#ee4d2d]">*</span>
                      {tr("商品图片", "Product images")}
                    </h3>
                    <span className="text-xs text-[#9aa0a8]">1:1 · JPG / PNG / WebP</span>
                  </div>
                  <ImageUrlGallery
                    cover={form.image ?? ""}
                    images={form.detail.images ?? []}
                    productName={form.name}
                    onCoverChange={(image) => update({ image: image || null })}
                    onImagesChange={(images) => updateDetail({ images })}
                    labels={{
                      cover: tr("封面", "Cover"),
                      add: tr("添加图片", "Add image"),
                      imageUrl: tr("图片地址", "Image URL"),
                      remove: tr("删除图片", "Remove image"),
                    }}
                  />
                </div>
                <div className="rounded-lg bg-[#f7f8f9] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-[#cfd4da] bg-white text-[#ee4d2d]">
                      <Video className="h-6 w-6" strokeWidth={1.6} />
                      <span className="mt-1 text-[10px]">{tr("商品视频", "Video")}</span>
                    </div>
                    <div className="pt-1 text-xs leading-5 text-[#89909b]">
                      <p className="font-medium text-[#555c66]">
                        {tr("视频上传接口尚未配置", "Video upload is not configured yet")}
                      </p>
                      <p>
                        {tr(
                          "当前仅保留视频位置，避免提供无法保存的操作。",
                          "This placeholder keeps the layout honest until an upload endpoint is available.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <Field label={t("admin.products.name")}>
                  <div className="relative">
                    <TextInput
                      value={form.name}
                      maxLength={120}
                      onChange={(event) => update({ name: event.target.value })}
                      className="h-11 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#a0a6ae]">
                      {form.name.length}/120
                    </span>
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label={t("admin.products.id")}
                    hint={isNew ? t("admin.products.idAuto") : t("admin.products.idLocked")}
                  >
                    <TextInput
                      value={form.id}
                      disabled={!isNew}
                      onChange={(event) => update({ id: event.target.value })}
                    />
                  </Field>
                  <Field label="Slug" hint={t("admin.products.slugHint")}>
                    <TextInput
                      value={form.slug}
                      onChange={(event) => update({ slug: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="attributes" title={tr("商品属性", "Product Attributes")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("admin.products.productType")}>
                  <TextInput
                    value={form.productType ?? ""}
                    onChange={(event) => update({ productType: event.target.value || null })}
                  />
                </Field>
                <Field label={t("admin.products.designColor")}>
                  <TextInput
                    value={form.designText ?? ""}
                    onChange={(event) => update({ designText: event.target.value || null })}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <div className="mb-1.5 text-sm font-medium text-[#242830]">
                    {t("admin.products.categories")}
                  </div>
                  {categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <a
                          key={category.href}
                          href={category.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-[#dbe2ea] bg-[#f6f9fc] px-3 py-1.5 text-xs text-[#3671a8] hover:border-[#a9c5df]"
                        >
                          {category.name} <ChevronRight className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[#d5d9de] px-4 py-3 text-xs text-[#9299a3]">
                      {tr("暂无关联分类", "No linked categories")}
                    </div>
                  )}
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="description" title="Description">
              <div className="space-y-5">
                <Field label={t("admin.products.description")}>
                  <TextArea
                    rows={7}
                    value={form.detail.description ?? ""}
                    onChange={(event) => updateDetail({ description: event.target.value || null })}
                    className="font-sans text-sm"
                  />
                </Field>
                <Field label={t("admin.products.benefits")}>
                  <StringListEditor
                    value={form.detail.benefits}
                    onChange={(benefits) => updateDetail({ benefits })}
                  />
                </Field>
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="sales" title={tr("销售资料", "Sales Information")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("admin.products.price")}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#78808b]">
                      S$
                    </span>
                    <NumberInput
                      value={form.price ?? ""}
                      onChange={(event) =>
                        update({
                          price: event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className="pl-9"
                    />
                  </div>
                </Field>
                <Field label={t("admin.products.originalPrice")}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#78808b]">
                      S$
                    </span>
                    <NumberInput
                      value={form.originalPrice ?? ""}
                      onChange={(event) =>
                        update({
                          originalPrice:
                            event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      className="pl-9"
                    />
                  </div>
                </Field>
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              id="shipping"
              title={tr("运费", "Shipping")}
              subtitle={tr(
                "商品尺寸将作为配送方式与包装评估的参考。",
                "Dimensions help assess delivery and packaging.",
              )}
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field label={t("admin.products.dimension")}>
                  <TextInput
                    value={form.detail.dimension ?? ""}
                    onChange={(event) => updateDetail({ dimension: event.target.value || null })}
                    placeholder="e.g. 20 × 12 × 8 cm"
                  />
                </Field>
                <div className="flex items-end">
                  <div className="flex h-9 items-center gap-2 rounded-md bg-[#eff8f5] px-3 text-xs font-medium text-[#16835f]">
                    <PackageCheck className="h-4 w-4" /> {tr("商城统一配送", "Store delivery")}
                  </div>
                </div>
              </div>
            </WorkspaceSection>

            <WorkspaceSection id="marketing" title="Marketing">
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-[#dbe9fb] bg-[#f2f7fe] p-4 text-xs leading-5 text-[#58708c]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#337dd1]" />
                <span>
                  {tr(
                    "标签会在商品列表和详情页强调促销或商品特点。",
                    "Labels highlight promotions and product features across the storefront.",
                  )}
                </span>
              </div>
              <SchemaListForm
                value={form.labels}
                onChange={(labels) => update({ labels: labels as Record<string, unknown>[] })}
                schema={LABEL_SCHEMA}
                labelKey="text"
                titleFor={(item) =>
                  `${String(item.text ?? t("admin.ui.unnamed"))}${item.backgroundColor ? ` (${item.backgroundColor})` : ""}`
                }
                newItem={() => ({ text: "", backgroundColor: "", textColor: "" })}
              />
            </WorkspaceSection>

            <WorkspaceSection id="other" title={tr("其他", "Other Information")}>
              <div className="space-y-5">
                <Field label={t("admin.products.materials")}>
                  <StringListEditor
                    value={form.detail.materials}
                    onChange={(materials) => updateDetail({ materials })}
                  />
                </Field>
                <Field label={t("admin.products.care")}>
                  <StringListEditor
                    value={form.detail.care}
                    onChange={(care) => updateDetail({ care })}
                  />
                </Field>
              </div>
            </WorkspaceSection>
          </main>

          <ProductPreview
            form={form}
            copy={{
              title: tr("预览", "Preview"),
              detail: tr("商品详情", "Product Detail"),
              sold: tr("已售 0", "0 sold"),
              buyNow: tr("立即购买", "Buy Now"),
              reference: tr(
                "此预览仅供参考，实际买家端效果以发布后页面为准。",
                "This preview is for reference only; the published storefront is the final result.",
              ),
            }}
          />
        </div>
      )}

      <div className="sticky bottom-0 z-30 mt-5 flex items-center justify-between border-t border-[#dde1e5] bg-white/95 px-4 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur md:px-6">
        <div className="hidden items-center gap-2 text-xs text-[#8d949e] sm:flex">
          <CircleCheck className="h-4 w-4 text-[#28a37a]" />
          {tr(`商品完整度 ${completeness}%`, `${completeness}% complete`)}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isNew ? (
            <ConfirmButton onConfirm={remove} variant="secondary">
              {t("admin.products.deleteProduct")}
            </ConfirmButton>
          ) : null}
          <Button variant="secondary" onClick={() => router.push("/admin/products")}>
            {tr("取消", "Cancel")}
          </Button>
          <Button
            onClick={save}
            disabled={saving}
            className="min-w-24 bg-[#ee4d2d] hover:bg-[#d94325] disabled:bg-[#f5a898]"
          >
            {saving ? t("admin.products.saving") : tr("更新", "Update")}
          </Button>
        </div>
      </div>
    </div>
  )
}
