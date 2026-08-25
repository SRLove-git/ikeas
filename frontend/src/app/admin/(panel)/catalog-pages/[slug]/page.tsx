"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import {
  adminFetch,
  BackLink,
  Button,
  Card,
  ConfirmButton,
  Field,
  Loading,
  NoticeArea,
  NumberInput,
  PageHeader,
  TextArea,
  TextInput,
  useNotice,
} from "@/components/admin/admin-ui"
import { BlockEditor, type ContentBlock } from "@/components/admin/BlockEditor"
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms"
import { formatPrice } from "@/lib/catalog-format"

interface CatalogPageForm {
  url: string
  name: string
  description: string | null
  total: number
  products: Record<string, unknown>[]
  blocks: ContentBlock[]
  productIds: string[]
}

function emptyForm(): CatalogPageForm {
  return {
    url: "",
    name: "",
    description: null,
    total: 0,
    products: [],
    blocks: [],
    productIds: [],
  }
}

export default function CatalogPageEditorPage() {
  const { t } = useTranslation();
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const isNew = params.slug === "new"
  const { notice, show } = useNotice()
  const [form, setForm] = useState<CatalogPageForm>(emptyForm())
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const PAGE_PRODUCT_SCHEMA: Schema = {
    fields: [
      { key: "id", label: t("admin.products.id"), kind: { type: "text" } },
      { key: "name", label: t("admin.catalogPages.colName"), kind: { type: "text" } },
      { key: "price", label: t("admin.products.price"), kind: { type: "number" } },
      { key: "image", label: t("admin.products.imageUrl"), kind: { type: "text" } },
      { key: "productType", label: t("admin.products.productType"), kind: { type: "text" } },
      { key: "designText", label: t("admin.products.designColor"), kind: { type: "text" } },
      { key: "measureText", label: t("admin.catalogPages.measureText"), kind: { type: "text" } },
      { key: "url", label: "URL", kind: { type: "text" } },
      { key: "seoSlug", label: t("admin.catalogPages.seoSlug"), kind: { type: "text" } },
    ],
  };

  useEffect(() => {
    if (isNew) return
    void (async () => {
      try {
        const page = await adminFetch<CatalogPageForm>(`/api/admin/catalog-pages/${params.slug}`)
        setForm(page)
      } catch (e) {
        show("error", (e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isNew, params.slug, show])

  const update = (patch: Partial<CatalogPageForm>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        total: form.products.length,
        productIds: form.products.map((p) => String(p.id)).filter(Boolean),
      }
      if (isNew) {
        await adminFetch("/api/admin/catalog-pages", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        show("success", t("admin.catalogPages.created"))
        router.replace("/admin/catalog-pages")
      } else {
        await adminFetch(`/api/admin/catalog-pages/${params.slug}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        show("success", t("admin.catalogPages.saved"))
      }
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/catalog-pages/${params.slug}`, { method: "DELETE" })
      show("success", t("admin.catalogPages.deleted"))
      router.replace("/admin/catalog-pages")
    } catch (e) {
      show("error", (e as Error).message)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-5xl">
      <BackLink href="/admin/catalog-pages" label={t("admin.catalogPages.backToList")} />
      <PageHeader
        title={
          isNew
            ? t("admin.catalogPages.newTitle")
            : t("admin.catalogPages.editTitle", { name: form.name })
        }
        description={form.url}
        actions={
          <>
            {form.url ? (
              <a href={form.url} target="_blank" rel="noreferrer">
                <Button variant="secondary">{t("admin.products.preview")} ↗</Button>
              </a>
            ) : null}
            {!isNew ? (
              <ConfirmButton onConfirm={remove}>{t("admin.catalogPages.deletePage")}</ConfirmButton>
            ) : null}
            <Button onClick={save} disabled={saving}>
              {saving ? t("admin.common.saving") : t("admin.common.save")}
            </Button>
          </>
        }
      />
      <NoticeArea notice={notice} />

      <Card title={t("admin.products.basicInfo")} className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL *" className="sm:col-span-2">
            <TextInput value={form.url} onChange={(e) => update({ url: e.target.value })} />
          </Field>
          <Field label={t("admin.catalogPages.name")}>
            <TextInput value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label={t("admin.catalogPages.totalAuto")}>
            <NumberInput value={form.total} disabled />
          </Field>
          <Field label={t("admin.products.description")} className="sm:col-span-2">
            <TextArea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => update({ description: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card
        title={t("admin.catalogPages.recommendedProducts", { count: form.products.length })}
        className="mb-6"
      >
        <SchemaListForm
          value={form.products}
          onChange={(products) => update({ products: products as Record<string, unknown>[] })}
          schema={PAGE_PRODUCT_SCHEMA}
          labelKey="name"
          titleFor={(item) =>
            `${String(item.name ?? item.id ?? t("admin.ui.unnamed"))}${
              item.price
                ? ` · ${formatPrice(typeof item.price === "number" ? item.price : null)}`
                : ""
            }`
          }
          newItem={() => ({
            id: "",
            name: "",
            price: null,
            image: null,
            productType: null,
            designText: null,
            measureText: null,
            url: null,
            seoSlug: null,
          })}
        />
      </Card>

      <Card title={t("admin.catalogPages.contentBlocks")}>
        <BlockEditor blocks={form.blocks} onChange={(blocks) => update({ blocks })} />
      </Card>
    </div>
  )
}
