"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  adminFetch,
  BackLink,
  Button,
  Card,
  ConfirmButton,
  Field,
  Loading,
  NoticeArea,
  NumberInput,
  ObjectListEditor,
  PageHeader,
  TextArea,
  TextInput,
  useNotice,
} from "@/components/admin/admin-ui";
import { BlockEditor, type ContentBlock } from "@/components/admin/BlockEditor";

interface CatalogPageForm {
  url: string;
  name: string;
  description: string | null;
  total: number;
  products: Record<string, unknown>[];
  blocks: ContentBlock[];
  productIds: string[];
}

function emptyForm(): CatalogPageForm {
  return {
    url: "",
    name: "",
    description: null,
    total: 0,
    products: [],
    blocks: [],
    productIds: [],
  };
}

export default function CatalogPageEditorPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const isNew = params.slug === "new";
  const { notice, show } = useNotice();
  const [form, setForm] = useState<CatalogPageForm>(emptyForm());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const page = await adminFetch<CatalogPageForm>(
          `/api/admin/catalog-pages/${params.slug}`,
        );
        setForm(page);
      } catch (e) {
        show("error", (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, params.slug, show]);

  const update = (patch: Partial<CatalogPageForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        total: form.products.length,
        productIds: form.products.map((p) => String(p.id)).filter(Boolean),
      };
      if (isNew) {
        await adminFetch("/api/admin/catalog-pages", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        show("success", "落地页创建成功");
        router.replace("/admin/catalog-pages");
      } else {
        await adminFetch(`/api/admin/catalog-pages/${params.slug}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        show("success", "落地页已保存");
      }
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/catalog-pages/${params.slug}`, { method: "DELETE" });
      show("success", "落地页已删除");
      router.replace("/admin/catalog-pages");
    } catch (e) {
      show("error", (e as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-5xl">
      <BackLink href="/admin/catalog-pages" label="返回落地页列表" />
      <PageHeader
        title={isNew ? "新建落地页" : `编辑落地页：${form.name}`}
        description={form.url}
        actions={
          <>
            {form.url ? (
              <a href={form.url} target="_blank" rel="noreferrer">
                <Button variant="secondary">前台预览 ↗</Button>
              </a>
            ) : null}
            {!isNew ? (
              <ConfirmButton onConfirm={remove}>删除落地页</ConfirmButton>
            ) : null}
            <Button onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </>
        }
      />
      <NoticeArea notice={notice} />

      <Card title="基本信息" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="URL *" className="sm:col-span-2">
            <TextInput
              value={form.url}
              onChange={(e) => update({ url: e.target.value })}
            />
          </Field>
          <Field label="名称 *">
            <TextInput
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>
          <Field label="商品总数（保存时自动计算）">
            <NumberInput value={form.total} disabled />
          </Field>
          <Field label="描述" className="sm:col-span-2">
            <TextArea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => update({ description: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card title={`推荐商品（${form.products.length}）`} className="mb-6">
        <ObjectListEditor
          value={form.products}
          onChange={(products) => update({ products })}
          labelKey="name"
          titleFor={(item) =>
            `${String(item.name ?? item.id ?? "未命名")}${item.price ? ` · SGD ${item.price}` : ""}`
          }
        />
      </Card>

      <Card title="内容区块">
        <BlockEditor
          blocks={form.blocks}
          onChange={(blocks) => update({ blocks })}
        />
      </Card>
    </div>
  );
}
