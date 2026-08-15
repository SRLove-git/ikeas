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
import { formatPrice } from "@/lib/catalog-format";

interface AdminOrderItem {
  productId: string;
  productName: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface AdminOrder {
  id: number;
  orderNo: string;
  userId: number;
  userName: string | null;
  userPhone: string | null;
  status: number;
  statusLabel: string;
  currency: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  customer: string | null;
  phone: string | null;
  address: string | null;
  remark: string | null;
  items: AdminOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface OrderForm {
  orderNo: string;
  createdAt: string;
  userName: string | null;
  userPhone: string | null;
  status: number;
  statusLabel: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  customer: string | null;
  phone: string | null;
  address: string | null;
  remark: string | null;
  items: AdminOrderItem[];
}

const STATUSES = [
  { value: "1", label: "待付款" },
  { value: "2", label: "待发货" },
  { value: "3", label: "待收货" },
  { value: "4", label: "已完成" },
  { value: "5", label: "已取消" },
  { value: "6", label: "退款中" },
];

function emptyForm(): OrderForm {
  return {
    orderNo: "",
    createdAt: "",
    userName: null,
    userPhone: null,
    status: 1,
    statusLabel: "待付款",
    subtotal: 0,
    deliveryFee: 9.9,
    totalAmount: 0,
    customer: null,
    phone: null,
    address: null,
    remark: null,
    items: [],
  };
}

function toForm(order: AdminOrder): OrderForm {
  return {
    orderNo: order.orderNo,
    createdAt: order.createdAt,
    userName: order.userName,
    userPhone: order.userPhone,
    status: order.status,
    statusLabel: order.statusLabel,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    totalAmount: order.totalAmount,
    customer: order.customer,
    phone: order.phone,
    address: order.address,
    remark: order.remark,
    items: order.items,
  };
}

export default function OrderEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderNo = params.id;
  const { notice, show } = useNotice();
  const [form, setForm] = useState<OrderForm>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const order = await adminFetch<AdminOrder>(`/api/admin/orders/${orderNo}`);
        setForm(toForm(order));
      } catch (e) {
        show("error", (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderNo, show]);

  const update = (patch: Partial<OrderForm>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const order = await adminFetch<AdminOrder>(`/api/admin/orders/${orderNo}`, {
        method: "PUT",
        body: JSON.stringify({
          status: form.status,
          deliveryFee: form.deliveryFee,
          customer: form.customer ?? "",
          phone: form.phone ?? "",
          address: form.address ?? "",
          remark: form.remark ?? "",
        }),
      });
      setForm(toForm(order));
      show("success", "订单已保存");
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/orders/${orderNo}`, { method: "DELETE" });
      show("success", "订单已删除");
      router.replace("/admin/orders");
    } catch (e) {
      show("error", (e as Error).message);
    }
  };

  if (loading) return <Loading label="加载订单…" />;

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/orders" label="返回订单列表" />
      <PageHeader
        title={`编辑订单：${form.orderNo}`}
        actions={
          <>
            <ConfirmButton onConfirm={remove}>删除订单</ConfirmButton>
            <Button onClick={save} disabled={saving}>
              {saving ? "保存中…" : "保存"}
            </Button>
          </>
        }
      />
      <NoticeArea notice={notice} />

      <Card title="订单信息" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="订单号">
            <TextInput value={form.orderNo} disabled />
          </Field>
          <Field label="下单时间">
            <TextInput value={form.createdAt} disabled />
          </Field>
          <Field label="用户">
            <TextInput value={form.userName ?? "未知用户"} disabled />
          </Field>
          <Field label="用户手机号">
            <TextInput value={form.userPhone ?? "—"} disabled />
          </Field>
          <Field label="状态">
            <Select
              value={String(form.status)}
              onChange={(e) => {
                const status = Number(e.target.value);
                update({
                  status,
                  statusLabel:
                    STATUSES.find((item) => item.value === e.target.value)?.label ??
                    "未知",
                });
              }}
            >
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="配送费">
            <NumberInput
              value={form.deliveryFee}
              onChange={(e) =>
                update({ deliveryFee: e.target.value === "" ? 0 : Number(e.target.value) })
              }
            />
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
          <Field label="收货地址" className="sm:col-span-2">
            <TextInput
              value={form.address ?? ""}
              onChange={(e) => update({ address: e.target.value || null })}
            />
          </Field>
          <Field label="备注" className="sm:col-span-2">
            <TextInput
              value={form.remark ?? ""}
              onChange={(e) => update({ remark: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card title={`订单商品（${form.items.length}）`}>
        <div className="space-y-3">
          {form.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between gap-4 border-b border-ikea-gray-100 pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-ikea-black">{item.productName}</p>
                <p className="mt-0.5 text-xs text-ikea-muted">
                  {item.productId} · {item.quantity} 件
                </p>
              </div>
              <p className="text-sm font-medium">{formatPrice(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
