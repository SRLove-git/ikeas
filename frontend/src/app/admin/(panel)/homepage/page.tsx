"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  adminFetch,
  Button,
  Card,
  JsonEditor,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  StringListEditor,
  cn,
  useNotice,
} from "@/components/admin/admin-ui"
import {
  FeedProductsEditor,
  SchemaListForm,
  SchemaObjectForm,
  type Schema,
} from "@/components/admin/HomepageForms"

type SectionSchema =
  | { kind: "strings" }
  | { kind: "object"; schema: Schema }
  | {
      kind: "objects"
      schema: Schema
      labelKey?: string
      newItem?: () => Record<string, unknown>
    }
  | { kind: "feed" }

interface SectionConfig {
  key: string
  label: string
  description: string
}

function buildConfigs(t: (key: string) => string) {
  const SECTIONS: SectionConfig[] = [
    { key: "noticeMessages", label: t("admin.homepage.section.topNotice"), description: t("admin.homepage.section.topNoticeDesc") },
    { key: "searchHints", label: t("admin.homepage.section.searchHints"), description: t("admin.homepage.section.searchHintsDesc") },
    { key: "navMenuItems", label: t("admin.homepage.section.navMenu"), description: t("admin.homepage.section.navMenuDesc") },
    { key: "megaMenuCategories", label: t("admin.homepage.section.megaMenu"), description: t("admin.homepage.section.megaMenuDesc") },
    {
      key: "heroVideo",
      label: t("admin.homepage.section.heroVideo"),
      description: t("admin.homepage.section.heroVideoDesc"),
    },
    { key: "promoCardItems", label: t("admin.homepage.section.promo"), description: t("admin.homepage.section.promoDesc") },
    { key: "inspirationTipsItems", label: t("admin.homepage.section.inspirationTips"), description: t("admin.homepage.section.inspirationTipsDesc") },
    { key: "serviceColumns", label: t("admin.homepage.section.serviceColumns"), description: t("admin.homepage.section.serviceColumnsDesc") },
    { key: "rankingSections", label: t("admin.homepage.section.rankings"), description: t("admin.homepage.section.rankingsDesc") },
    { key: "roomPillItems", label: t("admin.homepage.section.roomPills"), description: t("admin.homepage.section.roomPillsDesc") },
    { key: "roomPillCta", label: t("admin.homepage.section.roomPillCta"), description: t("admin.homepage.section.roomPillCtaDesc") },
    { key: "sustainabilityPillItems", label: t("admin.homepage.section.sustainPills"), description: t("admin.homepage.section.sustainPillsDesc") },
    { key: "sustainabilityPillCta", label: t("admin.homepage.section.sustainCta"), description: t("admin.homepage.section.sustainCtaDesc") },
    { key: "feedProducts", label: t("admin.homepage.section.feed"), description: t("admin.homepage.section.feedDesc") },
    { key: "assurances", label: t("admin.homepage.section.assurances"), description: t("admin.homepage.section.assurancesDesc") },
    { key: "recallNotices", label: t("admin.homepage.section.recalls"), description: t("admin.homepage.section.recallsDesc") },
    { key: "footerLinkGroups", label: t("admin.homepage.section.footerLinks"), description: t("admin.homepage.section.footerLinksDesc") },
    { key: "footerFeaturedCards", label: t("admin.homepage.section.footerCards"), description: t("admin.homepage.section.footerCardsDesc") },
    { key: "socialIcons", label: t("admin.homepage.section.socialIcons"), description: t("admin.homepage.section.socialIconsDesc") },
    { key: "legalBar", label: t("admin.homepage.section.legalBar"), description: t("admin.homepage.section.legalBarDesc") },
  ]

  const LINK_SCHEMA: Schema = {
    fields: [
      { key: "label", label: t("admin.homepage.field.text"), kind: { type: "text" } },
      { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
    ],
  }

  const PILL_SCHEMA: Schema = {
    fields: [
      { key: "label", label: t("admin.homepage.field.name"), kind: { type: "text" } },
      { key: "image", label: t("admin.homepage.field.image"), kind: { type: "text" } },
      { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
    ],
  }

  const PILL_CTA_SCHEMA: Schema = {
    fields: [
      { key: "label", label: t("admin.homepage.field.ctaLabel"), kind: { type: "text" } },
      { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
      { key: "color", label: t("admin.homepage.field.bgColor"), kind: { type: "text" } },
      { key: "textColor", label: t("admin.homepage.field.textColor"), kind: { type: "text" } },
    ],
  }

  const RANKING_PRODUCT_SCHEMA: Schema = {
    fields: [
      { key: "name", label: t("admin.homepage.field.name"), kind: { type: "text" } },
      { key: "price", label: t("admin.homepage.field.price"), kind: { type: "text" } },
      { key: "originalPrice", label: t("admin.homepage.field.originalPrice"), kind: { type: "text" } },
      { key: "image", label: t("admin.homepage.field.image"), kind: { type: "text" } },
      { key: "icon", label: t("admin.homepage.field.icon"), kind: { type: "text" } },
      { key: "badge", label: t("admin.homepage.field.badge"), kind: { type: "text" } },
      { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
    ],
  }

  const SCHEMAS: Record<string, SectionSchema> = {
    noticeMessages: {
      kind: "objects",
      labelKey: "text",
      schema: {
        fields: [
          { key: "text", label: t("admin.homepage.field.noticeText"), kind: { type: "text" } },
          { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
        ],
      },
    },
    searchHints: { kind: "strings" },
    navMenuItems: {
      kind: "objects",
      labelKey: "label",
      schema: {
        fields: [
          { key: "label", label: t("admin.homepage.field.menuName"), kind: { type: "text" } },
          { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
          {
            key: "hasMegaMenu",
            label: t("admin.homepage.field.hasMegaMenu"),
            kind: { type: "boolean" },
          },
          {
            key: "menuPanelLabel",
            label: t("admin.homepage.field.menuPanel"),
            kind: { type: "text" },
            hint: t("admin.homepage.field.menuPanelHint"),
          },
        ],
      },
    },
    megaMenuCategories: {
      kind: "objects",
      labelKey: "name",
      schema: {
        fields: [
          { key: "name", label: t("admin.homepage.field.categoryName"), kind: { type: "text" } },
          {
            key: "subCategories",
            label: t("admin.homepage.field.subCategories"),
            kind: { type: "stringList", placeholder: t("admin.homepage.field.subCategoryName") },
          },
        ],
      },
    },
    heroVideo: {
      kind: "object",
      schema: {
        fields: [
          {
            key: "video",
            label: t("admin.homepage.field.video"),
            kind: { type: "text" },
            hint: t("admin.homepage.field.videoHint"),
          },
          { key: "poster", label: t("admin.homepage.field.poster"), kind: { type: "text" } },
          { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
          { key: "alt", label: t("admin.homepage.field.altText"), kind: { type: "text" } },
        ],
      },
    },
    promoCardItems: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          { key: "eyebrow", label: t("admin.homepage.field.eyebrow"), kind: { type: "text" } },
          { key: "title", label: t("admin.homepage.field.title"), kind: { type: "text" } },
          { key: "description", label: t("admin.homepage.field.description"), kind: { type: "textarea" } },
          { key: "badge", label: t("admin.homepage.field.badge"), kind: { type: "text" } },
          { key: "image", label: t("admin.homepage.field.image"), kind: { type: "text" } },
          { key: "backgroundColor", label: t("admin.homepage.field.bgColor"), kind: { type: "text" } },
          { key: "textColor", label: t("admin.homepage.field.textColor"), kind: { type: "text" } },
          { key: "ctaLabel", label: t("admin.homepage.field.ctaLabel"), kind: { type: "text" } },
          { key: "ctaHref", label: t("admin.homepage.field.ctaHref"), kind: { type: "text" } },
          { key: "href", label: t("admin.homepage.field.cardHref"), kind: { type: "text" } },
        ],
      },
    },
    inspirationTipsItems: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          { key: "eyebrow", label: t("admin.homepage.field.eyebrow"), kind: { type: "text" } },
          { key: "title", label: t("admin.homepage.field.title"), kind: { type: "text" } },
          { key: "description", label: t("admin.homepage.field.description"), kind: { type: "textarea" } },
          { key: "badge", label: t("admin.homepage.field.badge"), kind: { type: "text" } },
          { key: "image", label: t("admin.homepage.field.image"), kind: { type: "text" } },
          {
            key: "theme",
            label: t("admin.homepage.field.theme"),
            kind: {
              type: "select",
              options: [
                { value: "yellow", label: t("admin.homepage.field.themeYellow") },
                { value: "blue", label: t("admin.homepage.field.themeBlue") },
                { value: "red", label: t("admin.homepage.field.themeRed") },
                { value: "beige", label: t("admin.homepage.field.themeBeige") },
                { value: "white", label: t("admin.homepage.field.themeWhite") },
              ],
            },
          },
          { key: "ctaLabel", label: t("admin.homepage.field.ctaLabel"), kind: { type: "text" } },
          { key: "ctaHref", label: t("admin.homepage.field.ctaHref"), kind: { type: "text" } },
        ],
      },
    },
    serviceColumns: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          { key: "title", label: t("admin.homepage.field.title"), kind: { type: "text" } },
          { key: "description", label: t("admin.homepage.field.description"), kind: { type: "textarea" } },
          { key: "backgroundImage", label: t("admin.homepage.field.backgroundImage"), kind: { type: "text" } },
          { key: "ctaLabel", label: t("admin.homepage.field.ctaLabel"), kind: { type: "text" } },
          { key: "ctaHref", label: t("admin.homepage.field.ctaHref"), kind: { type: "text" } },
        ],
      },
    },
    rankingSections: {
      kind: "objects",
      labelKey: "name",
      schema: {
        fields: [
          { key: "id", label: "ID", kind: { type: "text" } },
          { key: "name", label: t("admin.homepage.field.rankingName"), kind: { type: "text" } },
          { key: "backgroundColor", label: t("admin.homepage.field.bgColor"), kind: { type: "text" } },
          {
            key: "products",
            label: t("admin.homepage.field.rankingProducts"),
            kind: { type: "objectList", schema: RANKING_PRODUCT_SCHEMA },
          },
        ],
      },
    },
    roomPillItems: { kind: "objects", labelKey: "label", schema: PILL_SCHEMA },
    roomPillCta: { kind: "object", schema: PILL_CTA_SCHEMA },
    sustainabilityPillItems: {
      kind: "objects",
      labelKey: "label",
      schema: PILL_SCHEMA,
    },
    sustainabilityPillCta: { kind: "object", schema: PILL_CTA_SCHEMA },
    feedProducts: { kind: "feed" },
    assurances: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          {
            key: "icon",
            label: t("admin.homepage.field.icon"),
            kind: {
              type: "select",
              options: [
                { value: "truck", label: t("admin.homepage.field.iconTruck") },
                { value: "assembly", label: t("admin.homepage.field.iconAssembly") },
                { value: "design", label: t("admin.homepage.field.iconDesign") },
                { value: "installation", label: t("admin.homepage.field.iconInstallation") },
              ],
            },
          },
          { key: "title", label: t("admin.homepage.field.title"), kind: { type: "text" } },
          { key: "description", label: t("admin.homepage.field.description"), kind: { type: "textarea" } },
          { key: "ctaLabel", label: t("admin.homepage.field.ctaLabel"), kind: { type: "text" } },
          { key: "ctaHref", label: t("admin.homepage.field.ctaHref"), kind: { type: "text" } },
        ],
      },
    },
    recallNotices: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          { key: "title", label: t("admin.homepage.field.title"), kind: { type: "text" } },
          { key: "date", label: t("admin.homepage.field.date"), kind: { type: "text" } },
          { key: "href", label: t("admin.homepage.field.href"), kind: { type: "text" } },
          { key: "image", label: t("admin.homepage.field.image"), kind: { type: "text" } },
        ],
      },
    },
    footerLinkGroups: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          { key: "title", label: t("admin.homepage.field.groupTitle"), kind: { type: "text" } },
          {
            key: "links",
            label: t("admin.homepage.field.linkList"),
            kind: { type: "objectList", schema: LINK_SCHEMA },
          },
        ],
      },
    },
    footerFeaturedCards: {
      kind: "objects",
      labelKey: "title",
      schema: {
        fields: [
          { key: "eyebrow", label: t("admin.homepage.field.eyebrow"), kind: { type: "text" } },
          { key: "title", label: t("admin.homepage.field.title"), kind: { type: "text" } },
          { key: "description", label: t("admin.homepage.field.description"), kind: { type: "textarea" } },
          { key: "image", label: t("admin.homepage.field.image"), kind: { type: "text" } },
          {
            key: "links",
            label: t("admin.homepage.field.linkList"),
            kind: { type: "objectList", schema: LINK_SCHEMA },
          },
        ],
      },
    },
    socialIcons: {
      kind: "objects",
      labelKey: "name",
      schema: {
        fields: [
          { key: "name", label: t("admin.homepage.field.name"), kind: { type: "text" } },
          { key: "src", label: t("admin.homepage.field.icon"), kind: { type: "text" } },
        ],
      },
    },
    legalBar: {
      kind: "object",
      schema: {
        fields: [
          { key: "edition", label: t("admin.homepage.field.edition"), kind: { type: "text" } },
          {
            key: "links",
            label: t("admin.homepage.field.linkList"),
            kind: { type: "objectList", schema: LINK_SCHEMA },
          },
        ],
      },
    },
  }

  return { SECTIONS, SCHEMAS }
}

export default function HomepageEditorPage() {
  const { t } = useTranslation()
  const { SECTIONS, SCHEMAS } = buildConfigs(t)
  const { notice, show } = useNotice()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [selected, setSelected] = useState<string>(SECTIONS[0].key)
  const [jsonMode, setJsonMode] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const homepage = await adminFetch<Record<string, unknown>>("/api/admin/homepage")
        setData(homepage)
      } catch (e) {
        show("error", (e as Error).message)
      }
    })()
  }, [show])

  if (!data) return <Loading />

  const config = SECTIONS.find((section) => section.key === selected)!
  const schema = SCHEMAS[selected]
  const value = data[selected]
  const useJson = jsonMode[selected] ?? false

  const updateValue = (next: unknown) => {
    setData((current) => (current ? { ...current, [selected]: next } : current))
  }

  const save = async () => {
    setSaving(true)
    try {
      await adminFetch("/api/admin/homepage", {
        method: "PUT",
        body: JSON.stringify({ updates: { [selected]: data[selected] } }),
      })
      show("success", t("admin.homepage.saved", { label: config.label }))
    } catch (e) {
      show("error", (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const renderBody = () => {
    if (useJson) {
      return <JsonEditor value={value} onChange={updateValue} rows={16} />
    }
    if (schema.kind === "strings" && Array.isArray(value)) {
      return <StringListEditor value={value as string[]} onChange={updateValue} />
    }
    if (schema.kind === "object") {
      return (
        <SchemaObjectForm
          value={
            value && typeof value === "object" && !Array.isArray(value)
              ? (value as Record<string, unknown>)
              : {}
          }
          schema={schema.schema}
          onChange={updateValue}
        />
      )
    }
    if (schema.kind === "objects") {
      return (
        <SchemaListForm
          value={value}
          schema={schema.schema}
          onChange={updateValue}
          labelKey={schema.labelKey}
          newItem={schema.newItem}
        />
      )
    }
    return <FeedProductsEditor value={value} onChange={updateValue} />
  }

  return (
    <div>
      <PageHeader
        title={t("admin.homepage.title")}
        description={t("admin.homepage.desc")}
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? t("admin.common.saving") : t("admin.homepage.saveSection")}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="self-start">
          <ul className="-mx-2 space-y-0.5">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  type="button"
                  onClick={() => setSelected(section.key)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selected === section.key
                      ? "bg-ikea-blue text-white"
                      : "text-ikea-black hover:bg-ikea-gray-100",
                  )}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={t("admin.homepage.cardTitle", { label: config.label, key: config.key })}
          actions={
            <div className="flex items-center gap-3">
              <span className="text-xs text-ikea-muted">{config.description}</span>
              <Button
                variant="secondary"
                onClick={() =>
                  setJsonMode((current) => ({
                    ...current,
                    [selected]: !(current[selected] ?? false),
                  }))
                }
              >
                {useJson ? t("admin.homepage.switchForm") : t("admin.homepage.jsonMode")}
              </Button>
            </div>
          }
        >
          {renderBody()}
          {!Array.isArray(value) && typeof value !== "object" ? (
            <div className="mt-3">
              <Notice kind="info">{t("admin.homepage.notArrayNotice")}</Notice>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
