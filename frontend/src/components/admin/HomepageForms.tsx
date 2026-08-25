"use client";

import { useTranslation } from "react-i18next";
import {
  Button,
  TextInput,
} from "@/components/admin/admin-ui";
import {
  SchemaListForm,
  type Schema,
} from "@/components/admin/SchemaForms";

export type { Schema };
export { SchemaObjectForm, SchemaListForm } from "@/components/admin/SchemaForms";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function FeedProductsEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const { t } = useTranslation();
  const FEED_PRODUCT_SCHEMA: Schema = {
    fields: [
      { key: "productId", label: t("admin.products.id"), kind: { type: "text" } },
      { key: "title", label: t("admin.homepageForms.title"), kind: { type: "text" } },
      { key: "desc", label: t("admin.homepageForms.desc"), kind: { type: "text" } },
      {
        key: "price",
        label: t("admin.products.price"),
        kind: { type: "text" },
        hint: t("admin.homepageForms.priceHint"),
      },
      { key: "href", label: t("admin.homepageForms.href"), kind: { type: "text" } },
      { key: "image", label: t("admin.homepageForms.image"), kind: { type: "text" } },
      {
        key: "left",
        label: t("admin.homepageForms.left"),
        kind: { type: "text" },
        hint: t("admin.homepageForms.leftHint"),
      },
      {
        key: "top",
        label: t("admin.homepageForms.top"),
        kind: { type: "text" },
        hint: t("admin.homepageForms.topHint"),
      },
      {
        key: "tooltipPosition",
        label: t("admin.homepageForms.tooltipPosition"),
        kind: { type: "text" },
        hint: t("admin.homepageForms.tooltipPositionHint"),
      },
      {
        key: "tags",
        label: t("admin.homepageForms.tags"),
        kind: { type: "stringList", placeholder: t("admin.homepageForms.tagPlaceholder") },
      },
      {
        key: "tagStyle",
        label: t("admin.homepageForms.tagStyle"),
        kind: { type: "textarea" },
        hint: t("admin.homepageForms.tagStyleHint"),
      },
    ],
  };
  const groups = Object.entries(asObject(value));

  const setGroup = (group: string, items: unknown) => {
    onChange({ ...asObject(value), [group]: items });
  };

  const renameGroup = (oldGroup: string, next: string) => {
    const copy = { ...asObject(value) };
    if (next.trim()) {
      copy[next] = copy[oldGroup];
    }
    delete copy[oldGroup];
    onChange(copy);
  };

  const removeGroup = (group: string) => {
    const copy = { ...asObject(value) };
    delete copy[group];
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <p className="text-sm text-ikea-muted">{t("admin.homepageForms.emptyGroups")}</p>
      ) : null}
      {groups.map(([group, items]) => (
        <div key={group} className="rounded-md border border-ikea-gray-200 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="w-48">
              <TextInput
                value={group}
                aria-label={t("admin.homepageForms.groupAria")}
                onChange={(event) => renameGroup(group, event.target.value)}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                onClick={() => {
                  const copy = [...groups];
                  const index = copy.findIndex(([name]) => name === group);
                  if (index > 0) {
                    const temp = copy[index - 1];
                    copy[index - 1] = copy[index];
                    copy[index] = temp;
                    onChange(Object.fromEntries(copy));
                  }
                }}
              >
                {t("admin.ui.moveUp")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const copy = [...groups];
                  const index = copy.findIndex(([name]) => name === group);
                  if (index >= 0 && index < copy.length - 1) {
                    const temp = copy[index + 1];
                    copy[index + 1] = copy[index];
                    copy[index] = temp;
                    onChange(Object.fromEntries(copy));
                  }
                }}
              >
                {t("admin.ui.moveDown")}
              </Button>
              <Button variant="ghost" onClick={() => removeGroup(group)}>
                {t("admin.homepageForms.deleteGroup")}
              </Button>
            </div>
          </div>
          <SchemaListForm
            value={items}
            schema={FEED_PRODUCT_SCHEMA}
            onChange={(next) => setGroup(group, next)}
            labelKey="title"
            newItem={() => ({ left: "", top: "", tags: [] })}
          />
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => {
          const copy = { ...asObject(value) };
          let name = t("admin.homepageForms.newGroup");
          let index = 1;
          while (copy[name]) {
            name = t("admin.homepageForms.newGroupN", { n: index++ });
          }
          copy[name] = [];
          onChange(copy);
        }}
      >
        {t("admin.homepageForms.addGroup")}
      </Button>
    </div>
  );
}
