"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminFetch,
  Button,
  Card,
  Field,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  TextInput,
  cn,
  useNotice,
} from "@/components/admin/admin-ui";
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  url: string;
  image: string | null;
  subs: Record<string, unknown>[];
  products: unknown[];
}

const SUB_SCHEMA: Schema = {
  fields: [
    { key: "name", label: "子分类名称", kind: { type: "text" } },
    { key: "slug", label: "Slug", kind: { type: "text" } },
    { key: "url", label: "URL", kind: { type: "text" } },
    { key: "image", label: "图片 URL", kind: { type: "text" } },
  ],
};

export default function CategoriesPage() {
  const { notice, show } = useNotice();
  const [kind, setKind] = useState<"catalog" | "channel">("catalog");
  const [categories, setCategories] = useState<Record<string, unknown> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Record<string, unknown>>("/api/admin/categories");
        setCategories(data);
      } catch (e) {
        show("error", (e as Error).message);
      }
    })();
  }, [show]);

  const list = useMemo(() => {
    if (!categories) return [];
    return (categories[kind === "catalog" ? "catalogCategories" : "channelCategories"] ??
      []) as CategoryItem[];
  }, [categories, kind]);

  if (!categories) return <Loading />;

  const selected = selectedIndex === null ? null : list[selectedIndex] ?? null;

  const updateSelected = (patch: Partial<CategoryItem>) => {
    if (selectedIndex === null) return;
    const key = kind === "catalog" ? "catalogCategories" : "channelCategories";
    const copy = [...list];
    copy[selectedIndex] = { ...copy[selectedIndex], ...patch } as CategoryItem;
    setCategories({ ...categories, [key]: copy });
  };

  const save = async () => {
    if (selectedIndex === null) return;
    setSaving(true);
    try {
      const key = kind === "catalog" ? "catalogCategories" : "channelCategories";
      await adminFetch("/api/admin/categories", {
        method: "PUT",
        body: JSON.stringify({ [key]: categories[key] }),
      });
      show("success", "分类已保存");
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="分类管理"
        description="管理商品分类与频道分类的名称、链接、图片和子分类。"
      />
      <NoticeArea notice={notice} />

      <div className="mb-4 flex gap-2">
        <Button
          variant={kind === "catalog" ? "primary" : "secondary"}
          onClick={() => { setKind("catalog"); setSelectedIndex(null); }}
        >
          商品分类（{(categories.catalogCategories as unknown[]).length}）
        </Button>
        <Button
          variant={kind === "channel" ? "primary" : "secondary"}
          onClick={() => { setKind("channel"); setSelectedIndex(null); }}
        >
          频道分类（{(categories.channelCategories as unknown[]).length}）
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="self-start">
          <ul className="-mx-2 space-y-0.5">
            {list.map((category, index) => (
              <li key={category.id ?? category.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selectedIndex === index
                      ? "bg-ikea-blue text-white"
                      : "text-ikea-black hover:bg-ikea-gray-100",
                  )}
                >
                  <span className="block truncate font-medium">{category.name}</span>
                  <span className={cn("block truncate text-xs", selectedIndex === index ? "text-blue-100" : "text-ikea-muted")}>
                    {category.products.length} 件商品 · {category.subs.length} 个子分类
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {selected ? (
          <Card
            title={`编辑分类：${selected.name}`}
            actions={
              <Button onClick={save} disabled={saving}>
                {saving ? "保存中…" : "保存分类"}
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="名称 *">
                <TextInput
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                />
              </Field>
              <Field label="Slug">
                <TextInput
                  value={selected.slug}
                  onChange={(e) => updateSelected({ slug: e.target.value })}
                />
              </Field>
              <Field label="URL" className="sm:col-span-2">
                <TextInput
                  value={selected.url}
                  onChange={(e) => updateSelected({ url: e.target.value })}
                />
              </Field>
              <Field label="图片 URL" className="sm:col-span-2">
                <TextInput
                  value={selected.image ?? ""}
                  onChange={(e) => updateSelected({ image: e.target.value || null })}
                />
              </Field>
            </div>

            <div className="mt-6">
              <div className="mb-2 text-sm font-medium text-ikea-black">
                子分类（{selected.subs.length}）
              </div>
              <SchemaListForm
                value={selected.subs}
                onChange={(subs) =>
                  updateSelected({ subs: subs as Record<string, unknown>[] })
                }
                schema={SUB_SCHEMA}
                labelKey="name"
                titleFor={(item) => String(item.name ?? "未命名")}
                newItem={() => ({ name: "", slug: "", url: "", image: null })}
              />
            </div>

            <div className="mt-6 rounded-md border border-ikea-gray-200 bg-ikea-gray-50 p-4">
              <div className="mb-1 text-xs font-medium text-ikea-muted">分类内商品</div>
              <p className="text-xs text-ikea-muted">
                该分类包含 {selected.products.length} 件商品。商品请在「商品管理」中维护；
                如需调整分类下商品，可编辑下方 JSON（高级操作）。
              </p>
              <div className="mt-2 text-xs text-ikea-muted">
                提示：商品编辑器中可修改商品所属分类字段。
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <Notice kind="info">请从左侧选择要编辑的分类。</Notice>
          </Card>
        )}
      </div>
    </div>
  );
}
