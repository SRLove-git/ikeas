"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminFetch,
  ConfirmButton,
  EmptyState,
  Loading,
  Notice,
  NoticeArea,
  PageHeader,
  useNotice,
} from "@/components/admin/admin-ui";

interface CartEntry {
  productId: string;
  quantity: number;
  addedAt: number;
}

interface Cart {
  userId: string;
  user: { name: string; phone?: string | null } | null;
  items: CartEntry[];
}

export default function CartsPage() {
  const { t } = useTranslation();
  const { notice, show } = useNotice();
  const [carts, setCarts] = useState<Cart[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ items: Cart[] }>("/api/admin/server/carts");
      setCarts(data.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const clear = async (userId: string) => {
    await adminFetch(`/api/admin/server/carts/${userId}`, { method: "DELETE" });
    show("success", t("admin.carts.cleared"));
    await load();
  };

  return (
    <div>
      <PageHeader
        title={t("admin.carts.title")}
        description={t("admin.carts.desc")}
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!carts ? (
          <Loading label={t("admin.users.loading")} />
        ) : carts.length === 0 ? (
          <EmptyState>{t("admin.carts.empty")}</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t("admin.carts.colUser")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.carts.colItems")}</th>
                <th className="px-5 py-3 text-right font-medium">
                  {t("admin.common.colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {carts.map((cart) => (
                <tr key={cart.userId} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ikea-black">
                      {cart.user?.name ?? t("admin.orders.unknownUser")}
                    </div>
                    <div className="text-xs text-ikea-muted">{cart.userId}</div>
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {cart.items.map((item) => (
                      <div key={item.productId}>
                        {item.productId} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ConfirmButton onConfirm={() => clear(cart.userId)}>
                      {t("admin.carts.clearCart")}
                    </ConfirmButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
