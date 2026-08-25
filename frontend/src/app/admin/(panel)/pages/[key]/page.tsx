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
  PageHeader,
  Select,
  TextInput,
  useNotice,
} from "@/components/admin/admin-ui"
import { BlockEditor, type ContentBlock } from "@/components/admin/BlockEditor"

const FAMILIES = ["customer-service", "company", "legal", "root"]

interface PageForm {
  url: string
  family: string
  id: string | null
  title: string
  name: string | null
  hero: string | null
  blocks: ContentBlock[]
}

function emptyPage(): PageForm {
  return {
    url: "",
    family: "root",
    id: null,
    title: "",
    name: null,
    hero: null,
    blocks: [],
  }
}

export default function PageEditorPage() {
  const { t } = useTranslation()
  const FAMILY_LABEL: Record<string, string> = {
    "customer-service": t("admin.pages.familyCustomerService"),
    company: t("admin.pages.familyCompany"),
    legal: t("admin.pages.familyLegal"),
    root: t("admin.pages.familyRoot"),
  }
  const params = useParams<{ key: string }>()
  const router = useRouter()
  const isNew = params.key === "new"
  const { notice, show } = useNotice()
  const [form, setForm] = useState<PageForm>(emptyPage())
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    void (async () => {
      try {
        const page = await adminFetch<PageForm>(`/api/admin/pages/${params.key}`)
        setForm(page)
      } catch (e) {
        show("error", (e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isNew, params.key, show])

  const update = (patch: Partial<PageForm>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const save = async () => {
    setSaving(true)
    try {
      if (isNew) {
        await adminFetch("/api/admin/pages", {
          method: "POST",
          body: JSON.stringify(form),
        })
        show("success", t("admin.pages.created"))
        router.replace("/admin/pages")
      } else {
        await adminFetch(`/api/admin/pages/${params.key}`, {
          method: "PUT",
          body: JSON.stringify(form),
        })
        show("success", t("admin.pages.saved"))
      }
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/pages/${params.key}`, { method: "DELETE" })
      show("success", t("admin.pages.deleted"))
      router.replace("/admin/pages")
    } catch (e) {
      show("error", (e as Error).message)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-5xl">
      <BackLink href="/admin/pages" label={t("admin.pages.backToList")} />
      <PageHeader
        title={isNew ? t("admin.pages.newTitle") : t("admin.pages.editTitle", { title: form.title })}
        description={isNew ? t("admin.pages.newDesc") : form.url}
        actions={
          <>
            {form.url ? (
              <a href={form.url} target="_blank" rel="noreferrer">
                <Button variant="secondary">{t("admin.products.preview")} ↗</Button>
              </a>
            ) : null}
            {!isNew ? (
              <ConfirmButton onConfirm={remove}>{t("admin.pages.deletePage")}</ConfirmButton>
            ) : null}
            <Button onClick={save} disabled={saving}>
              {saving ? t("admin.common.saving") : t("admin.common.save")}
            </Button>
          </>
        }
      />

      <NoticeArea notice={notice} />

      <Card title={t("admin.pages.info")} className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL *" hint={t("admin.pages.urlHint")} className="sm:col-span-2">
            <TextInput value={form.url} onChange={(e) => update({ url: e.target.value })} />
          </Field>
          <Field label={t("admin.pages.title")}>
            <TextInput value={form.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label={t("admin.pages.family")}>
            <Select value={form.family} onChange={(e) => update({ family: e.target.value })}>
              {FAMILIES.map((family) => (
                <option key={family} value={family}>
                  {FAMILY_LABEL[family] ?? family}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("admin.pages.name")}>
            <TextInput
              value={form.name ?? ""}
              onChange={(e) => update({ name: e.target.value || null })}
            />
          </Field>
          <Field label={t("admin.pages.hero")}>
            <TextInput
              value={form.hero ?? ""}
              onChange={(e) => update({ hero: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.pages.blocks", { count: form.blocks.length })}>
        <BlockEditor blocks={form.blocks} onChange={(blocks) => update({ blocks })} />
      </Card>
    </div>
  )
}
