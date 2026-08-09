"use client";

import {
  Button,
  Field,
  NumberInput,
  Select,
  StringListEditor,
  TextArea,
  TextInput,
} from "@/components/admin/admin-ui";

export type FieldKind =
  | { type: "text" }
  | { type: "textarea" }
  | { type: "boolean" }
  | { type: "number" }
  | { type: "select"; options: { value: string; label: string }[] }
  | { type: "stringList"; placeholder?: string }
  | { type: "object"; schema: Schema }
  | { type: "objectList"; schema: Schema; newItem?: () => Record<string, unknown> };

export interface SchemaField {
  key: string;
  label: string;
  hint?: string;
  kind: FieldKind;
}

export interface Schema {
  fields: SchemaField[];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export function SchemaObjectForm({
  value,
  schema,
  onChange,
  compact = false,
}: {
  value: Record<string, unknown>;
  schema: Schema;
  onChange: (next: Record<string, unknown>) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "grid grid-cols-1 gap-3 md:grid-cols-2" : "grid grid-cols-1 gap-4 md:grid-cols-2"}
    >
      {schema.fields.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          value={value[field.key]}
          onChange={(next) => onChange({ ...value, [field.key]: next })}
        />
      ))}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const fullWidth =
    field.kind.type === "stringList" ||
    field.kind.type === "objectList" ||
    field.kind.type === "object" ||
    field.kind.type === "textarea" ||
    field.kind.type === "boolean";

  return (
    <Field
      label={field.label}
      hint={field.hint}
      className={fullWidth ? "md:col-span-2" : undefined}
    >
      {field.kind.type === "text" ? (
        <TextInput
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.kind.type === "textarea" ? (
        <TextArea
          rows={3}
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.kind.type === "boolean" ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          <span className="text-sm text-ikea-muted">启用</span>
        </label>
      ) : field.kind.type === "number" ? (
        <NumberInput
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : Number(event.target.value))
          }
        />
      ) : field.kind.type === "select" ? (
        <Select
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">请选择</option>
          {field.kind.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : field.kind.type === "stringList" ? (
        <StringListEditor
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder={field.kind.placeholder ?? "新项目"}
        />
      ) : field.kind.type === "object" ? (
        <div className="rounded-md border border-ikea-gray-200 bg-ikea-gray-50 p-3">
          <SchemaObjectForm
            value={asObject(value)}
            schema={field.kind.schema}
            onChange={onChange}
            compact
          />
        </div>
      ) : (
        <SchemaListForm
          value={value}
          schema={field.kind.schema}
          onChange={onChange}
          newItem={field.kind.newItem}
        />
      )}
    </Field>
  );
}

export function SchemaListForm({
  value,
  schema,
  onChange,
  labelKey = "title",
  titleFor,
  newItem,
}: {
  value: unknown;
  schema: Schema;
  onChange: (next: unknown) => void;
  labelKey?: string;
  titleFor?: (item: Record<string, unknown>, index: number) => string;
  newItem?: () => Record<string, unknown>;
}) {
  const items = asList(value);

  const update = (index: number, next: Record<string, unknown>) => {
    onChange(items.map((item, i) => (i === index ? next : item)));
  };

  const defaultTitle = (item: Record<string, unknown>) =>
    String(
      item[labelKey] ??
        item.title ??
        item.name ??
        item.label ??
        item.text ??
        "未命名",
    );

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-md border border-ikea-gray-200 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="truncate text-xs font-bold text-ikea-black">
              #{index + 1} {titleFor?.(item, index) ?? defaultTitle(item)}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                disabled={index === 0}
                onClick={() => {
                  const copy = [...items];
                  const temp = copy[index - 1];
                  copy[index - 1] = copy[index];
                  copy[index] = temp;
                  onChange(copy);
                }}
              >
                上移
              </Button>
              <Button
                variant="ghost"
                disabled={index === items.length - 1}
                onClick={() => {
                  const copy = [...items];
                  const temp = copy[index + 1];
                  copy[index + 1] = copy[index];
                  copy[index] = temp;
                  onChange(copy);
                }}
              >
                下移
              </Button>
              <Button
                variant="ghost"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                删除
              </Button>
            </div>
          </div>
          <SchemaObjectForm
            value={item}
            schema={schema}
            onChange={(next) => update(index, next)}
            compact
          />
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => onChange([...items, newItem ? newItem() : { [labelKey]: "" }])}
      >
        + 添加
      </Button>
    </div>
  );
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
