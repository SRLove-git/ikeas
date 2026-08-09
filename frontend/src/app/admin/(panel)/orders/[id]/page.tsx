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
  PageHeader,
  Select,
  TextInput,
  useNotice,
} from "@/components/admin/admin-ui";
import { SchemaListForm, type Schema } from "@/components/admin/SchemaForms";

interface OrderForm {
  id: string;
  date: string;
  status: string;
  customer?: string | null;
  phone?: string | null;
  address?: string | null;
  deliveryFee?: number | null;
  items: { productId: string; qty: number }[];
}

const ITEM_SCHEMA: Schema = {
  fields: [
    { key: "productId", label: "商品 ID", kind: { type: "text" } },
    { key: "qty", label: "数量", kind: { type: "number" } },
  ],
};

const STATUSES = ["待付款", "待发货", "待收货", "已完成", "已取消", "退款中"];

function emptyOrder(): OrderForm {
  return {
    id: "",
    date: new Date().toISOString().slice(0, 10),
    status: "待发货",
    customer: null,
    phone: null,
    address: null,
    deliveryFee: 9.9,
    items: [],
  };
}

export default function OrderEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const { notice, show } = useNotice();
  const [form, setForm] = useState<OrderForm>(emptyOrder());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const order = await adminFetch<OrderForm>(`/api/admin/orders/${params.id}`);
        setForm(order);
      } catch (e) {
        show("error", (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [isNew, params.id, show]);

  const update = (patch: Partial<OrderForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await adminFetch("/api/admin/orders", {
          method: "POST",
          body: JSON.stringify(form),
        });
        show("success", "订单创建成功");
        router.replace("/admin/orders");
      } else {
        await adminFetch(`/api/admin/orders/${params.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        show("success", "订单已保存");
      }
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/orders/${params.id}`, { method: "DELETE" });
      show("success", "订单已删除");
      router.replace("/admin/orders");
    } catch (e) {
      show("error", (e as Error).message);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/orders" label="返回订单列表" />
      <PageHeader
        title={isNew ? "新建订单" : `编辑订单：${form.id}`}
        actions={
          <>
            {!isNew ? (
              <ConfirmButton onConfirm={remove}>删除订单</ConfirmButton>
            ) : null}
            <Button onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </>
        }
      />
      <NoticeArea notice={notice} />

      <Card title="订单信息" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="订单号 *">
            <TextInput
              value={form.id}
              disabled={!isNew}
              onChange={(e) => update({ id: e.target.value })}
            />
          </Field>
          <Field label="日期">
            <TextInput
              value={form.date}
              onChange={(e) => update({ date: e.target.value })}
            />
          </Field>
          <Field label="状态">
            <Select value={form.status} onChange={(e) => update({ status: e.target.value })}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
              <option value={form.status}>{form.status}</option>
            </Select>
          </Field>
          <Field label="客户">
            <TextInput
              value={form.customer ?? ""}
              onChange={(e) => update({ customer: e.target.value || null })}
            />
          </Field>
          <Field label="手机号">
            <TextInput
              value={form.phone ?? ""}
              onChange={(e) => update({ phone: e.target.value || null })}
            />
          </Field>
          <Field label="配送费">
            <NumberInput
              value={form.deliveryFee ?? ""}
              onChange={(e) =>
                update({ deliveryFee: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </Field>
          <Field label="收货地址" className="sm:col-span-2">
            <TextInput
              value={form.address ?? ""}
              onChange={(e) => update({ address: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card title={`订单商品（${form.items.length}）`}>
        <SchemaListForm
          value={form.items as unknown as Record<string, unknown>[]}
          onChange={(items) => update({ items: items as unknown as OrderForm["items"] })}
          schema={ITEM_SCHEMA}
          labelKey="productId"
          titleFor={(item) => `商品 ${item.productId} × ${item.qty}`}
          newItem={() => ({ productId: "", qty: 1 })}
        />
      </Card>
    </div>
  );
}
