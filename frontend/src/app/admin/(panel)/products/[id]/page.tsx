"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
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
  useNotice,
} from "@/components/admin/admin-ui"
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms"

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

export default function ProductEditorPage() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const isNew = params.id === "new"
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
      } catch (e) {
        show("error", (e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isNew, params.id, show])

  const update = (patch: Partial<ProductForm>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const updateDetail = (patch: Partial<ProductForm["detail"]>) => {
    setForm((current) => ({ ...current, detail: { ...current.detail, ...patch } }))
  }

  const previewUrl = useMemo(() => {
    const slug = form.slug?.trim()
    return slug ? `/zh/p/${slug}/` : null
  }, [form.slug])

  const save = async () => {
    setSaving(true)
    try {
      const payload = rawMode ? raw : form
      if (isNew) {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        show("success", t("admin.products.created"))
        router.replace("/admin/products")
      } else {
        await adminFetch(`/api/admin/products/${params.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        show("success", t("admin.products.saved"))
      }
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/products/${params.id}`, { method: "DELETE" })
      show("success", t("admin.products.deleted"))
      router.replace("/admin/products")
    } catch (e) {
      show("error", (e as Error).message)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/products" label={t("admin.products.backToList")} />
      <PageHeader
        title={
          isNew ? t("admin.products.newTitle") : t("admin.products.editTitle", { name: form.name })
        }
        description={isNew ? t("admin.products.newDesc") : `ID: ${params.id}`}
        actions={
          <>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">{t("admin.products.preview")} ↗</Button>
              </a>
            ) : null}
            {!isNew ? (
              <ConfirmButton onConfirm={remove}>{t("admin.products.deleteProduct")}</ConfirmButton>
            ) : null}
            <Button onClick={save} disabled={saving}>
              {saving ? t("admin.products.saving") : t("admin.products.save")}
            </Button>
          </>
        }
      />

      <NoticeArea notice={notice} />

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-ikea-muted">{t("admin.products.editMode")}</span>
        <Button variant={rawMode ? "secondary" : "primary"} onClick={() => setRawMode(false)}>
          {t("admin.products.formEdit")}
        </Button>
        <Button
          variant={rawMode ? "primary" : "secondary"}
          onClick={() => {
            setRaw(form)
            setRawMode(true)
          }}
        >
          {t("admin.products.rawJson")}
        </Button>
      </div>

      {rawMode ? (
        <Card title={t("admin.products.rawCard")}>
          <JsonEditor value={raw ?? form} onChange={setRaw} rows={24} />
        </Card>
      ) : (
        <>
          <Card title={t("admin.products.basicInfo")} className="mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.products.name")}>
                <TextInput value={form.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field
                label={t("admin.products.id")}
                hint={isNew ? t("admin.products.idAuto") : t("admin.products.idLocked")}
              >
                <TextInput
                  value={form.id}
                  disabled={!isNew}
                  onChange={(e) => update({ id: e.target.value })}
                />
              </Field>
              <Field label="Slug" hint={t("admin.products.slugHint")}>
                <TextInput value={form.slug} onChange={(e) => update({ slug: e.target.value })} />
              </Field>
              <Field label={t("admin.products.productType")}>
                <TextInput
                  value={form.productType ?? ""}
                  onChange={(e) => update({ productType: e.target.value || null })}
                />
              </Field>
              <Field label={t("admin.products.designColor")}>
                <TextInput
                  value={form.designText ?? ""}
                  onChange={(e) => update({ designText: e.target.value || null })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("admin.products.price")}>
                  <NumberInput
                    value={form.price ?? ""}
                    onChange={(e) =>
                      update({ price: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label={t("admin.products.originalPrice")}>
                  <NumberInput
                    value={form.originalPrice ?? ""}
                    onChange={(e) =>
                      update({
                        originalPrice: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
              <Field label={t("admin.products.imageUrl")} className="sm:col-span-2">
                <TextInput
                  value={form.image ?? ""}
                  onChange={(e) => update({ image: e.target.value || null })}
                />
              </Field>
              {categories.length > 0 ? (
                <div className="sm:col-span-2">
                  <div className="mb-1.5 block text-sm font-medium text-ikea-black">
                    {t("admin.products.categories")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => (
                      <a
                        key={category.href}
                        href={category.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-blue-50 px-2 py-1 text-xs text-ikea-blue hover:underline"
                      >
                        {category.name} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card title={t("admin.products.labels")} className="mb-6">
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
          </Card>

          <Card title={t("admin.products.detail")} className="mb-6">
            <div className="space-y-6">
              <Field label={t("admin.products.detailImages")}>
                <StringListEditor
                  value={form.detail.images}
                  onChange={(images) => updateDetail({ images })}
                  placeholder="https://…"
                />
              </Field>
              <Field label={t("admin.products.benefits")}>
                <StringListEditor
                  value={form.detail.benefits}
                  onChange={(benefits) => updateDetail({ benefits })}
                />
              </Field>
              <Field label={t("admin.products.dimension")}>
                <TextInput
                  value={form.detail.dimension ?? ""}
                  onChange={(e) => updateDetail({ dimension: e.target.value || null })}
                />
              </Field>
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
              <Field label={t("admin.products.description")}>
                <TextArea
                  rows={4}
                  value={form.detail.description ?? ""}
                  onChange={(e) => updateDetail({ description: e.target.value || null })}
                />
              </Field>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
