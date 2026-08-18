"use client"

import { useState } from "react"
import {
  Button,
  JsonEditor,
  ObjectListEditor,
  StringListEditor,
  TextInput,
} from "@/components/admin/admin-ui"

export interface ContentBlock {
  type: string
  title: string | null
  texts: string[]
  images: string[]
  links: { href: string; text: string }[]
  columns: Record<string, unknown>[]
  items: Record<string, unknown>[]
  settings: Record<string, unknown> | null
}

const KNOWN_TYPES = [
  "carousel",
  "corporate-about",
  "corporate-hero",
  "corporate-pic-text",
  "corporate-policy",
  "corporate-stats",
  "corporate-team",
  "corporate-team-tabs",
  "corporate-text",
  "corporate-timeline",
  "support-assurances",
  "support-contact-banner",
  "support-faq",
  "support-quick-services",
  "support-search-hero",
  "pub-inspiration-card",
  "pub-text",
  "pub-columns",
  "pub-image",
  "pub-gallery",
  "pub-ranking",
  "pub-pill-slider",
  "pub-service-columns",
  "pub-promo-inspiration",
  "pub-video",
  "pub-accordion",
  "pub-faq",
]

export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const update = (index: number, patch: Partial<ContentBlock>) => {
    const copy = [...blocks]
    const current = copy[index]
    copy[index] = {
      type: current.type ?? "",
      title: current.title ?? null,
      texts: current.texts ?? [],
      images: current.images ?? [],
      links: current.links ?? [],
      columns: current.columns ?? [],
      items: current.items ?? [],
      settings: current.settings ?? null,
      ...patch,
    }
    onChange(copy)
  }

  const toggle = (index: number) => {
    const next = new Set(collapsed)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setCollapsed(next)
  }

  return (
    <div className="space-y-4">
      {blocks.length === 0 ? (
        <div className="rounded-md border border-dashed border-ikea-gray-300 p-6 text-center text-sm text-ikea-muted">
          还没有内容区块，点击下方按钮添加
        </div>
      ) : null}

      {blocks.map((block, index) => {
        const isCollapsed = collapsed.has(index)
        return (
          <div key={index} className="rounded-md border border-ikea-gray-200">
            <div className="flex items-center justify-between gap-2 border-b border-ikea-gray-200 bg-ikea-gray-50 px-3 py-2">
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <span className="text-xs font-bold text-ikea-muted">#{index + 1}</span>
                <span className="truncate text-sm font-medium text-ikea-black">
                  {block.type || "未命名区块"}
                </span>
                {block.title ? (
                  <span className="truncate text-xs text-ikea-muted">「{block.title}」</span>
                ) : null}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => {
                    const copy = [...blocks]
                    const temp = copy[index - 1]
                    copy[index - 1] = copy[index]
                    copy[index] = temp
                    onChange(copy)
                  }}
                >
                  上移
                </Button>
                <Button
                  variant="ghost"
                  disabled={index === blocks.length - 1}
                  onClick={() => {
                    const copy = [...blocks]
                    const temp = copy[index + 1]
                    copy[index + 1] = copy[index]
                    copy[index] = temp
                    onChange(copy)
                  }}
                >
                  下移
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => onChange(blocks.filter((_, i) => i !== index))}
                >
                  删除
                </Button>
                <Button variant="ghost" onClick={() => toggle(index)}>
                  {isCollapsed ? "展开" : "收起"}
                </Button>
              </div>
            </div>

            {!isCollapsed ? (
              <div className="space-y-4 p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-ikea-muted">区块类型</div>
                    <TextInput
                      list="admin-block-types"
                      value={block.type}
                      onChange={(e) => update(index, { type: e.target.value })}
                    />
                    <datalist id="admin-block-types">
                      {KNOWN_TYPES.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <div className="mb-1.5 text-xs font-medium text-ikea-muted">标题</div>
                    <TextInput
                      value={block.title ?? ""}
                      onChange={(e) => update(index, { title: e.target.value || null })}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-ikea-muted">
                    正文段落（texts）
                  </div>
                  <StringListEditor
                    value={block.texts ?? []}
                    onChange={(texts) => update(index, { texts })}
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-ikea-muted">图片（images）</div>
                  <StringListEditor
                    value={block.images ?? []}
                    onChange={(images) => update(index, { images })}
                    placeholder="https://…"
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-ikea-muted">链接（links）</div>
                  <ObjectListEditor
                    value={block.links ?? []}
                    onChange={(links) =>
                      update(index, { links: links as { href: string; text: string }[] })
                    }
                    labelKey="text"
                    titleFor={(item) => `${String(item.text ?? "")} → ${String(item.href ?? "")}`}
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-ikea-muted">
                    分栏（columns，标题/文字/图片/链接）
                  </div>
                  <ObjectListEditor
                    value={block.columns ?? []}
                    onChange={(columns) => update(index, { columns })}
                    titleFor={(item) => String(item.heading ?? item.text ?? "分栏")}
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-ikea-muted">
                    条目（items，例如图片卡片/排行项）
                  </div>
                  <ObjectListEditor
                    value={block.items ?? []}
                    onChange={(items) => update(index, { items })}
                    titleFor={(item) => String(item.title ?? item.text ?? item.name ?? "条目")}
                  />
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-ikea-muted">
                    设置（settings，高级）
                  </div>
                  <JsonEditor
                    value={block.settings}
                    onChange={(settings) =>
                      update(index, { settings: settings as Record<string, unknown> | null })
                    }
                    rows={4}
                  />
                </div>
              </div>
            ) : null}
          </div>
        )
      })}

      <Button
        variant="secondary"
        onClick={() =>
          onChange([
            ...blocks,
            {
              type: "pub-text",
              title: null,
              texts: [],
              images: [],
              links: [],
              columns: [],
              items: [],
              settings: null,
            },
          ])
        }
      >
        + 添加内容区块
      </Button>
    </div>
  )
}
