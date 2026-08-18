"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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

const FAMILIES = ["customer-service", "company", "root"]

const FAMILY_LABEL: Record<string, string> = {
  "customer-service": "客户服务",
  company: "公司介绍",
  root: "首页",
}

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
        show("success", "页面创建成功")
        router.replace("/admin/pages")
      } else {
        await adminFetch(`/api/admin/pages/${params.key}`, {
          method: "PUT",
          body: JSON.stringify(form),
        })
        show("success", "页面已保存，前台立即生效")
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
      show("success", "页面已删除")
      router.replace("/admin/pages")
    } catch (e) {
      show("error", (e as Error).message)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="max-w-5xl">
      <BackLink href="/admin/pages" label="返回页面列表" />
      <PageHeader
        title={isNew ? "新建页面" : `编辑页面：${form.title}`}
        description={isNew ? "创建后按 URL 在前台生效。" : form.url}
        actions={
          <>
            {form.url ? (
              <a href={form.url} target="_blank" rel="noreferrer">
                <Button variant="secondary">前台预览 ↗</Button>
              </a>
            ) : null}
            {!isNew ? <ConfirmButton onConfirm={remove}>删除页面</ConfirmButton> : null}
            <Button onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </>
        }
      />

      <NoticeArea notice={notice} />

      <Card title="页面信息" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL *" hint="例如 /cn/zh/ideas/my-idea/" className="sm:col-span-2">
            <TextInput value={form.url} onChange={(e) => update({ url: e.target.value })} />
          </Field>
          <Field label="标题 *">
            <TextInput value={form.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="栏目（family）">
            <Select value={form.family} onChange={(e) => update({ family: e.target.value })}>
              {FAMILIES.map((family) => (
                <option key={family} value={family}>
                  {FAMILY_LABEL[family] ?? family}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="英文名（name）">
            <TextInput
              value={form.name ?? ""}
              onChange={(e) => update({ name: e.target.value || null })}
            />
          </Field>
          <Field label="Hero 图 URL">
            <TextInput
              value={form.hero ?? ""}
              onChange={(e) => update({ hero: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card title={`内容区块（${form.blocks.length}）`}>
        <BlockEditor blocks={form.blocks} onChange={(blocks) => update({ blocks })} />
      </Card>
    </div>
  )
}
