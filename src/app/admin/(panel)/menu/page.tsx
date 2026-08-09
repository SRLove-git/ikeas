"use client";

import { useEffect, useState } from "react";
import {
  adminFetch,
  Button,
  Card,
  Loading,
  NoticeArea,
  ObjectListEditor,
  PageHeader,
  useNotice,
} from "@/components/admin/admin-ui";

interface MenuData {
  menuPanels: { menuPanels: Record<string, unknown>[]; appPromotion?: Record<string, unknown> };
  menuCategories: { categories: Record<string, unknown>[] };
}

export default function MenuPage() {
  const { notice, show } = useNotice();
  const [tab, setTab] = useState<"panels" | "categories">("panels");
  const [data, setData] = useState<MenuData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const menu = await adminFetch<MenuData>("/api/admin/menu");
        setData(menu);
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

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/menu", {
        method: "PUT",
        body: JSON.stringify(
          tab === "panels"
            ? { menuPanels: data.menuPanels }
            : { menuCategories: data.menuCategories },
        ),
      });
      show("success", "导航菜单已保存，立即生效");
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const panels = data.menuPanels.menuPanels;
  const categories = data.menuCategories.categories;

  return (
    <div>
      <PageHeader
        title="导航菜单"
        description="管理顶部下拉菜单面板和「所有商品」分类菜单。"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "保存中…" : "保存当前标签"}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <div className="mb-4 flex gap-2">
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

      {tab === "panels" ? (
        <Card
          title="菜单面板"
          actions={<span className="text-xs text-ikea-muted">面板 → 列 → 卡片/链接</span>}
        >
          <ObjectListEditor
            value={panels}
            onChange={setPanels}
            labelKey="label"
            titleFor={(item) => String(item.label ?? "未命名面板")}
          />
        </Card>
      ) : (
        <Card
          title="「所有商品」分类菜单"
          actions={<span className="text-xs text-ikea-muted">分类 → 子分类</span>}
        >
          <ObjectListEditor
            value={categories}
            onChange={setCategories}
            labelKey="name"
            titleFor={(item) => String(item.name ?? "未命名分类")}
          />
        </Card>
      )}
    </div>
  );
}
