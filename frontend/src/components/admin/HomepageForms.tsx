"use client";

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

const FEED_PRODUCT_SCHEMA: Schema = {
  fields: [
    { key: "productId", label: "商品 ID", kind: { type: "text" } },
    { key: "title", label: "标题", kind: { type: "text" } },
    { key: "desc", label: "描述", kind: { type: "text" } },
    { key: "price", label: "价格", kind: { type: "text" }, hint: "如 SGD 4.80" },
    { key: "href", label: "链接", kind: { type: "text" } },
    { key: "image", label: "图片", kind: { type: "text" } },
    { key: "left", label: "水平位置 left", kind: { type: "text" }, hint: "如 33%" },
    { key: "top", label: "垂直位置 top", kind: { type: "text" }, hint: "如 36%" },
    { key: "tooltipPosition", label: "提示位置", kind: { type: "text" }, hint: "如 is-top" },
    {
      key: "tags",
      label: "标签",
      kind: { type: "stringList", placeholder: "标签文字" },
    },
    { key: "tagStyle", label: "标签样式", kind: { type: "textarea" }, hint: "CSS 字符串，如 color: #fff; background-color: #0058a3;" },
  ],
};

export function FeedProductsEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: unknown) => void;
}) {
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
        <p className="text-sm text-ikea-muted">还没有分组，先添加一个分组。</p>
      ) : null}
      {groups.map(([group, items]) => (
        <div key={group} className="rounded-md border border-ikea-gray-200 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="w-48">
              <TextInput
                value={group}
                aria-label="分组名称"
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
                上移
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
                下移
              </Button>
              <Button variant="ghost" onClick={() => removeGroup(group)}>
                删除分组
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
          let name = "新分组";
          let index = 1;
          while (copy[name]) {
            name = `新分组 ${index++}`;
          }
          copy[name] = [];
          onChange(copy);
        }}
      >
        + 添加分组
      </Button>
    </div>
  );
}
