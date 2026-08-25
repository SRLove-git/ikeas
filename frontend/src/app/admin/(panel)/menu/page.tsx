"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

export default function MenuPage() {
  const { t } = useTranslation();
  const { notice, show } = useNotice();
  const [tab, setTab] = useState<"nav" | "panels" | "categories">("nav");
  const [data, setData] = useState<MenuData | null>(null);
  const [saving, setSaving] = useState(false);

  const MENU_LINK_SCHEMA: Schema = {
    fields: [
      { key: "title", label: t("admin.menu.field.text"), kind: { type: "text" } },
      { key: "href", label: t("admin.menu.field.href"), kind: { type: "text" } },
    ],
  };

  const MENU_CARD_SCHEMA: Schema = {
    fields: [
      { key: "title", label: t("admin.menu.field.title"), kind: { type: "text" } },
      { key: "href", label: t("admin.menu.field.href"), kind: { type: "text" } },
      { key: "image", label: t("admin.menu.field.image"), kind: { type: "text" } },
      { key: "description", label: t("admin.menu.field.description"), kind: { type: "text" } },
    ],
  };

  const MENU_COLUMN_SCHEMA: Schema = {
    fields: [
      { key: "heading", label: t("admin.menu.field.heading"), kind: { type: "text" } },
      { key: "intro", label: t("admin.menu.field.intro"), kind: { type: "text" } },
      {
        key: "cards",
        label: t("admin.menu.field.cards"),
        kind: { type: "objectList", schema: MENU_CARD_SCHEMA },
      },
      {
        key: "thumbnails",
        label: t("admin.menu.field.thumbnails"),
        kind: { type: "objectList", schema: MENU_CARD_SCHEMA },
      },
      {
        key: "links",
        label: t("admin.menu.field.linkList"),
        kind: { type: "objectList", schema: MENU_LINK_SCHEMA },
      },
    ],
  };

  const PANEL_SCHEMA: Schema = {
    fields: [
      { key: "label", label: t("admin.menu.field.panelName"), kind: { type: "text" } },
      { key: "href", label: t("admin.menu.field.href"), kind: { type: "text" } },
      {
        key: "columns",
        label: t("admin.menu.field.columns"),
        kind: { type: "objectList", schema: MENU_COLUMN_SCHEMA },
      },
    ],
  };

  const MENU_SUB_SCHEMA: Schema = {
    fields: [
      { key: "name", label: t("admin.menu.field.subName"), kind: { type: "text" } },
      { key: "url", label: t("admin.menu.field.href"), kind: { type: "text" } },
      { key: "image", label: t("admin.menu.field.image"), kind: { type: "text" } },
    ],
  };

  const CATEGORY_SCHEMA: Schema = {
    fields: [
      { key: "name", label: t("admin.menu.field.categoryName"), kind: { type: "text" } },
      { key: "url", label: t("admin.menu.field.href"), kind: { type: "text" } },
      { key: "image", label: t("admin.menu.field.image"), kind: { type: "text" } },
      {
        key: "subs",
        label: t("admin.menu.field.subs"),
        kind: { type: "objectList", schema: MENU_SUB_SCHEMA },
      },
    ],
  };

  const navItemSchema = (panelOptions: { value: string; label: string }[]): Schema => ({
    fields: [
      { key: "label", label: t("admin.menu.field.menuName"), kind: { type: "text" } },
      { key: "href", label: t("admin.menu.field.href"), kind: { type: "text" } },
      {
        key: "hasMegaMenu",
        label: t("admin.menu.field.hasMegaMenu"),
        kind: { type: "boolean" },
      },
      {
        key: "menuPanelLabel",
        label: t("admin.menu.field.menuPanel"),
        kind: { type: "select", options: panelOptions },
      },
    ],
  });

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
        show("success", t("admin.menu.navSaved"));
      } else {
        await adminFetch("/api/admin/menu", {
          method: "PUT",
          body: JSON.stringify(
            tab === "panels"
              ? { menuPanels: data.menuPanels }
              : { menuCategories: data.menuCategories },
          ),
        });
        show("success", t("admin.menu.menuSaved"));
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
        title={t("admin.menu.title")}
        description={t("admin.menu.desc")}
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? t("admin.common.saving") : t("admin.menu.saveTab")}
          </Button>
        }
      />
      <NoticeArea notice={notice} />

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === "nav" ? "primary" : "secondary"}
          onClick={() => setTab("nav")}
        >
          {t("admin.menu.tabNav", { count: navItems.length })}
        </Button>
        <Button
          variant={tab === "panels" ? "primary" : "secondary"}
          onClick={() => setTab("panels")}
        >
          {t("admin.menu.tabPanels", { count: panels.length })}
        </Button>
        <Button
          variant={tab === "categories" ? "primary" : "secondary"}
          onClick={() => setTab("categories")}
        >
          {t("admin.menu.tabCategories", { count: categories.length })}
        </Button>
      </div>

      {tab === "nav" ? (
        <Card
          title={t("admin.menu.navCard")}
          actions={
            <span className="text-xs text-ikea-muted">
              {t("admin.menu.navHint")}
            </span>
          }
        >
          <SchemaListForm
            value={navItems}
            onChange={(next) => setNavItems(next as Record<string, unknown>[])}
            schema={navItemSchema(panelOptions)}
            labelKey="label"
            titleFor={(item) => String(item.label ?? t("admin.menu.unnamedNav"))}
            newItem={() => ({ label: "", href: "", hasMegaMenu: false, menuPanelLabel: "" })}
          />
        </Card>
      ) : tab === "panels" ? (
        <Card
          title={t("admin.menu.panelsCard")}
          actions={<span className="text-xs text-ikea-muted">{t("admin.menu.panelsHint")}</span>}
        >
          <SchemaListForm
            value={panels}
            onChange={(next) => setPanels(next as Record<string, unknown>[])}
            schema={PANEL_SCHEMA}
            labelKey="label"
            titleFor={(item) => String(item.label ?? t("admin.menu.unnamedPanel"))}
            newItem={() => ({ label: "", href: "", columns: [] })}
          />
        </Card>
      ) : (
        <Card
          title={t("admin.menu.categoriesCard")}
          actions={<span className="text-xs text-ikea-muted">{t("admin.menu.categoriesHint")}</span>}
        >
          <SchemaListForm
            value={categories}
            onChange={(next) => setCategories(next as Record<string, unknown>[])}
            schema={CATEGORY_SCHEMA}
            labelKey="name"
            titleFor={(item) => String(item.name ?? t("admin.menu.unnamedCategory"))}
            newItem={() => ({ name: "", url: "", image: null, subs: [] })}
          />
        </Card>
      )}
    </div>
  );
}
