"use client";

import { useEffect, useState } from "react";
import {
  adminFetch,
  Button,
  Card,
  Loading,
  NoticeArea,
  PageHeader,
  useNotice,
} from "@/components/admin/admin-ui";
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms";

interface MenuData {
  menuPanels: { menuPanels: Record<string, unknown>[]; appPromotion?: Record<string, unknown> };
  menuCategories: { categories: Record<string, unknown>[] };
  navMenuItems: Record<string, unknown>[];
}

const MENU_LINK_SCHEMA: Schema = {
  fields: [
    { key: "title", label: "文字", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
  ],
};

const MENU_CARD_SCHEMA: Schema = {
  fields: [
    { key: "title", label: "标题", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
    { key: "image", label: "图片", kind: { type: "text" } },
    { key: "description", label: "描述", kind: { type: "text" } },
  ],
};

const MENU_COLUMN_SCHEMA: Schema = {
  fields: [
    { key: "heading", label: "栏目标题", kind: { type: "text" } },
    { key: "intro", label: "简介", kind: { type: "text" } },
    {
      key: "cards",
      label: "卡片",
      kind: { type: "objectList", schema: MENU_CARD_SCHEMA },
    },
    {
      key: "thumbnails",
      label: "缩略图",
      kind: { type: "objectList", schema: MENU_CARD_SCHEMA },
    },
    {
      key: "links",
      label: "链接列表",
      kind: { type: "objectList", schema: MENU_LINK_SCHEMA },
    },
  ],
};

const PANEL_SCHEMA: Schema = {
  fields: [
    { key: "label", label: "面板名称", kind: { type: "text" } },
    { key: "href", label: "链接", kind: { type: "text" } },
    {
      key: "columns",
      label: "栏目",
      kind: { type: "objectList", schema: MENU_COLUMN_SCHEMA },
    },
  ],
};

const MENU_SUB_SCHEMA: Schema = {
  fields: [
    { key: "name", label: "子分类名称", kind: { type: "text" } },
    { key: "url", label: "链接", kind: { type: "text" } },
    { key: "image", label: "图片", kind: { type: "text" } },
  ],
};

const CATEGORY_SCHEMA: Schema = {
  fields: [
    { key: "name", label: "分类名称", kind: { type: "text" } },
    { key: "url", label: "链接", kind: { type: "text" } },
    { key: "image", label: "图片", kind: { type: "text" } },
    {
      key: "subs",
      label: "子分类",
      kind: { type: "objectList", schema: MENU_SUB_SCHEMA },
    },
  ],
};

function navItemSchema(panelOptions: { value: string; label: string }[]): Schema {
  return {
    fields: [
      { key: "label", label: "菜单名称", kind: { type: "text" } },
      { key: "href", label: "链接", kind: { type: "text" } },
      {
        key: "hasMegaMenu",
        label: "全部分类下拉（Mega 菜单）",
        kind: { type: "boolean" },
      },
      {
        key: "menuPanelLabel",
        label: "下拉面板",
        kind: { type: "select", options: panelOptions },
      },
    ],
  };
}

export default function MenuPage() {
  const { notice, show } = useNotice();
  const [tab, setTab] = useState<"nav" | "panels" | "categories">("nav");
  const [data, setData] = useState<MenuData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [menu, homepage] = await Promise.all([
          adminFetch<MenuData>("/api/admin/menu"),
          adminFetch<Record<string, unknown>>("/api/admin/homepage"),
        ]);
        setData({
          ...menu,
          navMenuItems: Array.isArray(homepage.navMenuItems)
            ? (homepage.navMenuItems as Record<string, unknown>[])
            : [],
        });
      } catch (e) {
        show("error", (e as Error).message);
      }
    })();
  }, [show]);

  if (!data) return <Loading />;

  const setPanels = (panels: Record<string, unknown>[]) => {
    setData({ ...data, menuPanels: { ...data.menuPanels, menuPanels: panels } });
  };

  const setCategories = (categories: Record<string, unknown>[]) => {
    setData({ ...data, menuCategories: { ...data.menuCategories, categories } });
  };

  const setNavItems = (navMenuItems: Record<string, unknown>[]) => {
    setData({ ...data, navMenuItems });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (tab === "nav") {
        await adminFetch("/api/admin/homepage", {
          method: "PUT",
          body: JSON.stringify({ updates: { navMenuItems: data.navMenuItems } }),
        });
        show("success", "顶部导航已保存，前台立即生效");
      } else {
        await adminFetch("/api/admin/menu", {
          method: "PUT",
          body: JSON.stringify(
            tab === "panels"
              ? { menuPanels: data.menuPanels }
              : { menuCategories: data.menuCategories },
          ),
        });
        show("success", "导航菜单已保存，立即生效");
      }
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const panels = data.menuPanels.menuPanels;
  const categories = data.menuCategories.categories;
  const navItems = data.navMenuItems;
  const panelOptions = panels
    .map((panel) => String((panel as { label?: unknown }).label ?? ""))
    .filter(Boolean)
    .map((label) => ({ value: label, label }));

  return (
    <div>
      <PageHeader
        title="导航菜单"
        description="管理顶部导航栏、下拉菜单面板和「所有商品」分类菜单。"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存当前标签"}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "nav" ? "primary" : "secondary"}
          onClick={() => setTab("nav")}
        >
          顶部导航（{navItems.length}）
        </Button>
        <Button
          variant={tab === "panels" ? "primary" : "secondary"}
          onClick={() => setTab("panels")}
        >
          菜单面板（{panels.length}）
        </Button>
        <Button
          variant={tab === "categories" ? "primary" : "secondary"}
          onClick={() => setTab("categories")}
        >
          分类菜单（{categories.length}）
        </Button>
      </div>

      {tab === "nav" ? (
        <Card
          title="顶部导航栏"
          actions={
            <span className="text-xs text-ikea-muted">
              勾选 Mega 菜单或选择下拉面板后，鼠标悬停即显示下拉
            </span>
          }
        >
          <SchemaListForm
            value={navItems}
            onChange={(next) => setNavItems(next as Record<string, unknown>[])}
            schema={navItemSchema(panelOptions)}
            labelKey="label"
            titleFor={(item) => String(item.label ?? "未命名导航项")}
            newItem={() => ({ label: "", href: "", hasMegaMenu: false, menuPanelLabel: "" })}
          />
        </Card>
      ) : tab === "panels" ? (
        <Card
          title="菜单面板"
          actions={<span className="text-xs text-ikea-muted">面板 → 列 → 卡片/链接</span>}
        >
          <SchemaListForm
            value={panels}
            onChange={(next) => setPanels(next as Record<string, unknown>[])}
            schema={PANEL_SCHEMA}
            labelKey="label"
            titleFor={(item) => String(item.label ?? "未命名面板")}
            newItem={() => ({ label: "", href: "", columns: [] })}
          />
        </Card>
      ) : (
        <Card
          title="「所有商品」分类菜单"
          actions={<span className="text-xs text-ikea-muted">分类 → 子分类</span>}
        >
          <SchemaListForm
            value={categories}
            onChange={(next) => setCategories(next as Record<string, unknown>[])}
            schema={CATEGORY_SCHEMA}
            labelKey="name"
            titleFor={(item) => String(item.name ?? "未命名分类")}
            newItem={() => ({ name: "", url: "", image: null, subs: [] })}
          />
        </Card>
      )}
    </div>
  );
}
