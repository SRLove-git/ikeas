"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, Card, NoticeArea, PageHeader, useNotice } from "@/components/admin/admin-ui"
import type { IntroSite, SiteIntro } from "@/lib/site-intro"

export function SiteIntroEditor({ site, initial }: { site: IntroSite; initial: SiteIntro }) {
  const { t } = useTranslation()
  const [original, setOriginal] = useState(initial)
  const [value, setValue] = useState(initial)
  const [saving, setSaving] = useState(false)
  const { notice, show } = useNotice()
  const dirty = JSON.stringify(original) !== JSON.stringify(value)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/site-intros/${site}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, value }),
      })
      if (response.status === 401) {
        window.location.assign(`/admin/login/?next=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      if (!response.ok)
        throw new Error(
          t(response.status === 409 ? "admin.workspace.conflict" : "admin.workspace.failed"),
        )
      setOriginal(value)
      show("success", t("admin.workspace.saved"))
    } catch (error) {
      show("error", error instanceof Error ? error.message : t("admin.workspace.failed"))
    } finally {
      setSaving(false)
    }
  }
  return (
    <form onSubmit={save} className="max-w-5xl">
      <PageHeader
        title={t("admin.shell.homepageManagement")}
        description={t("admin.workspace.intro")}
      />
      <NoticeArea notice={notice} />
      <div className="grid gap-5 xl:grid-cols-2">
        {(["en", "zh"] as const).map((language) => (
          <Card key={language} title={language === "en" ? "English" : "中文"}>
            {(["eyebrow", "title", "description"] as const).map((field) => (
              <label key={field} className="mb-4 block text-sm font-medium">
                {t(`admin.workspace.${field}`)}
                <textarea
                  required
                  maxLength={1000}
                  rows={field === "description" ? 4 : 2}
                  className="mt-1 block w-full rounded-md border border-ikea-gray-300 p-2"
                  value={value[language][field]}
                  onChange={(event) =>
                    setValue({
                      ...value,
                      [language]: { ...value[language], [field]: event.target.value },
                    })
                  }
                />
              </label>
            ))}
          </Card>
        ))}
      </div>
      <div className="mt-5">
        <Button type="submit" disabled={!dirty || saving}>
          {t("admin.workspace.save")}
        </Button>
      </div>
    </form>
  )
}
