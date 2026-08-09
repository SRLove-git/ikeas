"use client";

import { useEffect, useState } from "react";
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
} from "@/components/admin/admin-ui";
import {
  FeedProductsEditor,
  SchemaListForm,
  SchemaObjectForm,
  type Schema,
} from "@/components/admin/HomepageForms";

type SectionSchema =
  | { kind: "strings" }
  | { kind: "object"; schema: Schema }
  | {
      kind: "objects";
      schema: Schema;
      labelKey?: string;
      newItem?: () => Record<string, unknown>;
    }
  | { kind: "feed" };

interface SectionConfig {
  key: string;
  label: string;
  description: string;
}

const SECTIONS: SectionConfig[] = [
  { key: "noticeMessages", label: "顶部通知", description: "公告栏消息" },
  { key: "searchHints", label: "搜索提示词", description: "搜索框滚动提示" },
  { key: "navMenuItems", label: "主导航", description: "顶部一级菜单项" },
  { key: "megaMenuCategories", label: "Mega 菜单分类", description: "所有商品下拉菜单分类" },
  { key: "heroSlides", label: "Hero 轮播", description: "首页首屏大图轮播" },
  { key: "promoCardItems", label: "必逛好物", description: "促销推荐卡片" },
  { key: "inspirationTipsItems", label: "布置小贴士", description: "家居灵感提示卡片" },
  { key: "serviceColumns", label: "服务栏目", description: "服务介绍卡片" },
  { key: "rankingSections", label: "榜单排行", description: "热销榜等排行区块" },
  { key: "roomPillItems", label: "房间探索胶囊", description: "从房间开始探索" },
  { key: "roomPillCta", label: "房间探索 CTA", description: "房间胶囊底部按钮" },
  { key: "sustainabilityPillItems", label: "可持续胶囊", description: "可持续生活胶囊" },
  { key: "sustainabilityPillCta", label: "可持续 CTA", description: "可持续胶囊底部按钮" },
  { key: "feedProducts", label: "灵感商品热点图", description: "按分类聚合的商品热点图" },
  { key: "assurances", label: "服务保障", description: "放心购保障条目" },
  { key: "recallNotices", label: "召回公告", description: "商品召回/通知文章" },
  { key: "footerLinkGroups", label: "页脚链接组", description: "页脚常用链接" },
  { key: "footerFeaturedCards", label: "页脚特色卡片", description: "页脚会员推广卡片" },
  { key: "socialIcons", label: "社交图标", description: "页脚社交图标" },
  { key: "legalBar", label: "版权与法律链接", description: "页脚版权与备案" },
];

const LINK_SCHEMA: Schema = {
  fields: [
    { key: "label", label: "文字", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
  ],
};

const CTA_SCHEMA: Schema = {
  fields: [
    { key: "label", label: "按钮文字", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
  ],
};

const PILL_SCHEMA: Schema = {
  fields: [
    { key: "label", label: "名称", kind: { type: "text" } },
    { key: "image", label: "图片", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
  ],
};

const PILL_CTA_SCHEMA: Schema = {
  fields: [
    { key: "label", label: "按钮文字", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
    { key: "color", label: "背景色", kind: { type: "text" } },
    { key: "textColor", label: "文字颜色", kind: { type: "text" } },
  ],
};

const RANKING_PRODUCT_SCHEMA: Schema = {
  fields: [
    { key: "name", label: "名称", kind: { type: "text" } },
    { key: "price", label: "价格", kind: { type: "text" } },
    { key: "originalPrice", label: "原价", kind: { type: "text" } },
    { key: "image", label: "图片", kind: { type: "text" } },
    { key: "icon", label: "图标", kind: { type: "text" } },
    { key: "badge", label: "角标", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
  ],
};

const SCHEMAS: Record<string, SectionSchema> = {
  noticeMessages: {
    kind: "objects",
    labelKey: "text",
    schema: {
      fields: [
        { key: "text", label: "公告内容", kind: { type: "text" } },
        { key: "href", label: "链接", kind: { type: "text" } },
      ],
    },
  },
  searchHints: { kind: "strings" },
  navMenuItems: {
    kind: "objects",
    labelKey: "label",
    schema: {
      fields: [
        { key: "label", label: "菜单名称", kind: { type: "text" } },
        { key: "href", label: "链接", kind: { type: "text" } },
        { key: "hasMegaMenu", label: "显示下拉菜单", kind: { type: "boolean" } },
      ],
    },
  },
  megaMenuCategories: {
    kind: "objects",
    labelKey: "name",
    schema: {
      fields: [
        { key: "name", label: "分类名称", kind: { type: "text" } },
        {
          key: "subCategories",
          label: "子分类",
          kind: { type: "stringList", placeholder: "子分类名称" },
        },
      ],
    },
  },
  heroSlides: {
    kind: "objects",
    labelKey: "title",
    schema: {
      fields: [
        { key: "id", label: "ID", kind: { type: "text" } },
        { key: "image", label: "图片", kind: { type: "text" } },
        { key: "imageAlt", label: "图片替代文本", kind: { type: "text" } },
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "subtitle", label: "副标题", kind: { type: "text" } },
        { key: "href", label: "链接", kind: { type: "text" } },
        { key: "cta", label: "按钮", kind: { type: "object", schema: CTA_SCHEMA } },
      ],
    },
  },
  promoCardItems: {
    kind: "objects",
    labelKey: "title",
    schema: {
      fields: [
        { key: "eyebrow", label: "眉题", kind: { type: "text" } },
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "description", label: "描述", kind: { type: "textarea" } },
        { key: "badge", label: "角标", kind: { type: "text" } },
        { key: "image", label: "图片", kind: { type: "text" } },
        { key: "backgroundColor", label: "背景色", kind: { type: "text" } },
        { key: "textColor", label: "文字颜色", kind: { type: "text" } },
        { key: "ctaLabel", label: "按钮文字", kind: { type: "text" } },
        { key: "ctaHref", label: "按钮链接", kind: { type: "text" } },
        { key: "href", label: "整卡链接", kind: { type: "text" } },
      ],
    },
  },
  inspirationTipsItems: {
    kind: "objects",
    labelKey: "title",
    schema: {
      fields: [
        { key: "eyebrow", label: "眉题", kind: { type: "text" } },
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "description", label: "描述", kind: { type: "textarea" } },
        { key: "badge", label: "角标", kind: { type: "text" } },
        { key: "image", label: "图片", kind: { type: "text" } },
        {
          key: "theme",
          label: "主题色",
          kind: {
            type: "select",
            options: [
              { value: "yellow", label: "黄色" },
              { value: "blue", label: "蓝色" },
              { value: "red", label: "红色" },
              { value: "beige", label: "米色" },
              { value: "white", label: "白色" },
            ],
          },
        },
        { key: "ctaLabel", label: "按钮文字", kind: { type: "text" } },
        { key: "ctaHref", label: "按钮链接", kind: { type: "text" } },
      ],
    },
  },
  serviceColumns: {
    kind: "objects",
    labelKey: "title",
    schema: {
      fields: [
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "description", label: "描述", kind: { type: "textarea" } },
        { key: "backgroundImage", label: "背景图", kind: { type: "text" } },
        { key: "ctaLabel", label: "按钮文字", kind: { type: "text" } },
        { key: "ctaHref", label: "按钮链接", kind: { type: "text" } },
      ],
    },
  },
  rankingSections: {
    kind: "objects",
    labelKey: "name",
    schema: {
      fields: [
        { key: "id", label: "ID", kind: { type: "text" } },
        { key: "name", label: "榜单名称", kind: { type: "text" } },
        { key: "backgroundColor", label: "背景色", kind: { type: "text" } },
        {
          key: "products",
          label: "上榜商品",
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
          label: "图标",
          kind: {
            type: "select",
            options: [
              { value: "truck", label: "配送" },
              { value: "assembly", label: "组装" },
              { value: "design", label: "设计" },
              { value: "installation", label: "安装" },
            ],
          },
        },
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "description", label: "描述", kind: { type: "textarea" } },
        { key: "ctaLabel", label: "按钮文字", kind: { type: "text" } },
        { key: "ctaHref", label: "按钮链接", kind: { type: "text" } },
      ],
    },
  },
  recallNotices: {
    kind: "objects",
    labelKey: "title",
    schema: {
      fields: [
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "date", label: "日期", kind: { type: "text" } },
        { key: "href", label: "链接", kind: { type: "text" } },
        { key: "image", label: "图片", kind: { type: "text" } },
      ],
    },
  },
  footerLinkGroups: {
    kind: "objects",
    labelKey: "title",
    schema: {
      fields: [
        { key: "title", label: "组标题", kind: { type: "text" } },
        {
          key: "links",
          label: "链接列表",
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
        { key: "eyebrow", label: "眉题", kind: { type: "text" } },
        { key: "title", label: "标题", kind: { type: "text" } },
        { key: "description", label: "描述", kind: { type: "textarea" } },
        { key: "image", label: "图片", kind: { type: "text" } },
        {
          key: "links",
          label: "链接列表",
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
        { key: "name", label: "名称", kind: { type: "text" } },
        { key: "src", label: "图标", kind: { type: "text" } },
      ],
    },
  },
  legalBar: {
    kind: "object",
    schema: {
      fields: [
        { key: "edition", label: "版权信息", kind: { type: "text" } },
        {
          key: "links",
          label: "链接列表",
          kind: { type: "objectList", schema: LINK_SCHEMA },
        },
      ],
    },
  },
};

export default function HomepageEditorPage() {
  const { notice, show } = useNotice();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [selected, setSelected] = useState<string>(SECTIONS[0].key);
  const [jsonMode, setJsonMode] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const homepage = await adminFetch<Record<string, unknown>>("/api/admin/homepage");
        setData(homepage);
      } catch (e) {
        show("error", (e as Error).message);
      }
    })();
  }, [show]);

  if (!data) return <Loading />;

  const config = SECTIONS.find((section) => section.key === selected)!;
  const schema = SCHEMAS[selected];
  const value = data[selected];
  const useJson = jsonMode[selected] ?? false;

  const updateValue = (next: unknown) => {
    setData((current) => (current ? { ...current, [selected]: next } : current));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/homepage", {
        method: "PUT",
        body: JSON.stringify({ updates: { [selected]: data[selected] } }),
      });
      show("success", `「${config.label}」已保存，首页立即生效`);
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const renderBody = () => {
    if (useJson) {
      return <JsonEditor value={value} onChange={updateValue} rows={16} />;
    }
    if (schema.kind === "strings" && Array.isArray(value)) {
      return <StringListEditor value={value as string[]} onChange={updateValue} />;
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
      );
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
      );
    }
    return <FeedProductsEditor value={value} onChange={updateValue} />;
  };

  return (
    <div>
      <PageHeader
        title="首页管理"
        description="按区块以表单方式编辑首页内容（轮播、促销、榜单、页脚等），保存后即时生效。"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存当前区块"}
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
          title={`${config.label}（${config.key}）`}
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
                {useJson ? "切换为表单" : "JSON 模式"}
              </Button>
            </div>
          }
        >
          {renderBody()}
          {!Array.isArray(value) && typeof value !== "object" ? (
            <div className="mt-3">
              <Notice kind="info">该区块内容不是数组或对象，已切换到 JSON 编辑。</Notice>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
