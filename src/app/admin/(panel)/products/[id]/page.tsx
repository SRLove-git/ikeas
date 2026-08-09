"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  adminFetch,
  BackLink,
  Button,
  Card,
  ConfirmButton,
  Field,
  JsonEditor,
  Loading,
  NoticeArea,
  NumberInput,
  ObjectListEditor,
  PageHeader,
  StringListEditor,
  TextArea,
  TextInput,
  useNotice,
} from "@/components/admin/admin-ui";

interface ProductForm {
  id: string;
  slug: string;
  name: string;
  productType?: string | null;
  designText?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  image?: string | null;
  labels: Record<string, unknown>[];
  detail: {
    images: string[];
    benefits: string[];
    dimension?: string | null;
    materials: string[];
    care: string[];
    description?: string | null;
  };
}

function emptyProduct(): ProductForm {
  return {
    id: "",
    slug: "",
    name: "",
    productType: null,
    designText: null,
    price: null,
    originalPrice: null,
    image: null,
    labels: [],
    detail: {
      images: [],
      benefits: [],
      dimension: null,
      materials: [],
      care: [],
      description: null,
    },
  };
}

export default function ProductEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const { notice, show } = useNotice();
  const [form, setForm] = useState<ProductForm>(emptyProduct());
  const [rawMode, setRawMode] = useState(false);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<{ name: string; href: string }[]>([]);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const product = await adminFetch<Record<string, unknown>>(
          `/api/admin/products/${params.id}`,
        );
        setCategories(
          (product.categories as { name: string; href: string }[] | undefined) ?? [],
        );
        delete product.categories;
        setForm(product as unknown as ProductForm);
        setRaw(product);
      } catch (e) {
        show("error", (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, params.id, show]);

  const update = (patch: Partial<ProductForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const updateDetail = (patch: Partial<ProductForm["detail"]>) => {
    setForm((current) => ({ ...current, detail: { ...current.detail, ...patch } }));
  };

  const previewUrl = useMemo(() => {
    const slug = form.slug?.trim();
    return slug ? `/cn/zh/p/${slug}/` : null;
  }, [form.slug]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = rawMode ? raw : form;
      if (isNew) {
        await adminFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        show("success", "商品创建成功");
        router.replace("/admin/products");
      } else {
        await adminFetch(`/api/admin/products/${params.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        show("success", "商品已保存");
      }
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/products/${params.id}`, { method: "DELETE" });
      show("success", "商品已删除");
      router.replace("/admin/products");
    } catch (e) {
      show("error", (e as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/products" label="返回商品列表" />
      <PageHeader
        title={isNew ? "新建商品" : `编辑商品：${form.name}`}
        description={isNew ? "创建一件新商品，保存后立即在前台生效。" : `ID: ${params.id}`}
        actions={
          <>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">前台预览 ↗</Button>
              </a>
            ) : null}
            {!isNew ? (
              <ConfirmButton onConfirm={remove}>删除商品</ConfirmButton>
            ) : null}
            <Button onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </>
        }
      />

      <NoticeArea notice={notice} />

      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-ikea-muted">编辑模式：</span>
        <Button
          variant={rawMode ? "secondary" : "primary"}
          onClick={() => setRawMode(false)}
        >
          表单编辑
        </Button>
        <Button
          variant={rawMode ? "primary" : "secondary"}
          onClick={() => {
            setRaw(form);
            setRawMode(true);
          }}
        >
          原始 JSON
        </Button>
      </div>

      {rawMode ? (
        <Card title="商品原始数据">
          <JsonEditor value={raw ?? form} onChange={setRaw} rows={24} />
        </Card>
      ) : (
        <>
          <Card title="基本信息" className="mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="商品名称 *">
                <TextInput
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </Field>
              <Field label="商品 ID" hint={isNew ? "留空自动生成" : "创建后不可修改"}>
                <TextInput
                  value={form.id}
                  disabled={!isNew}
                  onChange={(e) => update({ id: e.target.value })}
                />
              </Field>
              <Field label="Slug" hint="用于商品详情页 URL">
                <TextInput
                  value={form.slug}
                  onChange={(e) => update({ slug: e.target.value })}
                />
              </Field>
              <Field label="商品类型">
                <TextInput
                  value={form.productType ?? ""}
                  onChange={(e) => update({ productType: e.target.value || null })}
                />
              </Field>
              <Field label="设计/颜色">
                <TextInput
                  value={form.designText ?? ""}
                  onChange={(e) => update({ designText: e.target.value || null })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="价格">
                  <NumberInput
                    value={form.price ?? ""}
                    onChange={(e) =>
                      update({ price: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="原价">
                  <NumberInput
                    value={form.originalPrice ?? ""}
                    onChange={(e) =>
                      update({
                        originalPrice:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>
              <Field label="主图 URL" className="sm:col-span-2">
                <TextInput
                  value={form.image ?? ""}
                  onChange={(e) => update({ image: e.target.value || null })}
                />
              </Field>
              {categories.length > 0 ? (
                <div className="sm:col-span-2">
                  <div className="mb-1.5 block text-sm font-medium text-ikea-black">
                    所属分类
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => (
                      <a
                        key={category.href}
                        href={category.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded bg-blue-50 px-2 py-1 text-xs text-ikea-blue hover:underline"
                      >
                        {category.name} ↗
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="标签" className="mb-6">
            <ObjectListEditor
              value={form.labels}
              onChange={(labels) => update({ labels })}
              titleFor={(item) =>
                `${String(item.text ?? "未命名")}${item.backgroundColor ? `（${item.backgroundColor}）` : ""}`
              }
            />
          </Card>

          <Card title="商品详情" className="mb-6">
            <div className="space-y-6">
              <Field label="详情图片（URL 列表）">
                <StringListEditor
                  value={form.detail.images}
                  onChange={(images) => updateDetail({ images })}
                  placeholder="https://…"
                />
              </Field>
              <Field label="卖点（benefits）">
                <StringListEditor
                  value={form.detail.benefits}
                  onChange={(benefits) => updateDetail({ benefits })}
                />
              </Field>
              <Field label="尺寸">
                <TextInput
                  value={form.detail.dimension ?? ""}
                  onChange={(e) => updateDetail({ dimension: e.target.value || null })}
                />
              </Field>
              <Field label="材质（materials）">
                <StringListEditor
                  value={form.detail.materials}
                  onChange={(materials) => updateDetail({ materials })}
                />
              </Field>
              <Field label="保养（care）">
                <StringListEditor
                  value={form.detail.care}
                  onChange={(care) => updateDetail({ care })}
                />
              </Field>
              <Field label="描述">
                <TextArea
                  rows={4}
                  value={form.detail.description ?? ""}
                  onChange={(e) => updateDetail({ description: e.target.value || null })}
                />
              </Field>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
