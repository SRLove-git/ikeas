"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const STATUSES = [
    { value: "1", label: t("admin.orders.statusPending") },
    { value: "2", label: t("admin.orders.statusToShip") },
    { value: "3", label: t("admin.orders.statusToReceive") },
    { value: "4", label: t("admin.orders.statusCompleted") },
    { value: "5", label: t("admin.orders.statusCancelled") },
    { value: "6", label: t("admin.orders.statusRefunding") },
  ];
  const emptyForm = (): OrderForm => ({
    orderNo: "",
    createdAt: "",
    userName: null,
    userPhone: null,
    status: 1,
    statusLabel: t("admin.orders.statusPending"),
    subtotal: 0,
    deliveryFee: 9.9,
    totalAmount: 0,
    customer: null,
    phone: null,
    address: null,
    remark: null,
    items: [],
  });
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
      show("success", t("admin.orders.saved"));
    } catch (e) {
      show("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await adminFetch(`/api/admin/orders/${orderNo}`, { method: "DELETE" });
      show("success", t("admin.orders.deleted"));
      router.replace("/admin/orders");
    } catch (e) {
      show("error", (e as Error).message);
    }
  };

  if (loading) return <Loading label={t("admin.orders.loadingOrder")} />;

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/orders" label={t("admin.orders.backToList")} />
      <PageHeader
        title={t("admin.orders.editTitle", { no: form.orderNo })}
        actions={
          <>
            <ConfirmButton onConfirm={remove}>{t("admin.orders.deleteOrder")}</ConfirmButton>
            <Button onClick={save} disabled={saving}>
              {saving ? t("admin.common.saving") : t("admin.common.save")}
            </Button>
          </>
        }
      />
      <NoticeArea notice={notice} />

      <Card title={t("admin.orders.orderInfo")} className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.orders.orderNo")}>
            <TextInput value={form.orderNo} disabled />
          </Field>
          <Field label={t("admin.orders.createdAt")}>
            <TextInput value={form.createdAt} disabled />
          </Field>
          <Field label={t("admin.orders.user")}>
            <TextInput value={form.userName ?? t("admin.orders.unknownUser")} disabled />
          </Field>
          <Field label={t("admin.orders.userPhone")}>
            <TextInput value={form.userPhone ?? "—"} disabled />
          </Field>
          <Field label={t("admin.orders.status")}>
            <Select
              value={String(form.status)}
              onChange={(e) => {
                const status = Number(e.target.value);
                update({
                  status,
                  statusLabel:
                    STATUSES.find((item) => item.value === e.target.value)?.label ??
                    t("admin.orders.unknownStatus"),
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
          <Field label={t("admin.orders.deliveryFee")}>
            <NumberInput
              value={form.deliveryFee}
              onChange={(e) =>
                update({ deliveryFee: e.target.value === "" ? 0 : Number(e.target.value) })
              }
            />
          </Field>
          <Field label={t("admin.orders.customer")}>
            <TextInput
              value={form.customer ?? ""}
              onChange={(e) => update({ customer: e.target.value || null })}
            />
          </Field>
          <Field label={t("admin.orders.phone")}>
            <TextInput
              value={form.phone ?? ""}
              onChange={(e) => update({ phone: e.target.value || null })}
            />
          </Field>
          <Field label={t("admin.orders.address")} className="sm:col-span-2">
            <TextInput
              value={form.address ?? ""}
              onChange={(e) => update({ address: e.target.value || null })}
            />
          </Field>
          <Field label={t("admin.orders.remark")} className="sm:col-span-2">
            <TextInput
              value={form.remark ?? ""}
              onChange={(e) => update({ remark: e.target.value || null })}
            />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.orders.itemsCard", { count: form.items.length })}>
        <div className="space-y-3">
          {form.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between gap-4 border-b border-ikea-gray-100 pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-ikea-black">{item.productName}</p>
                <p className="mt-0.5 text-xs text-ikea-muted">
                  {t("admin.orders.itemMeta", { id: item.productId, count: item.quantity })}
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
