"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  adminFetch,
  Button,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";

interface Coupon {
  id: number;
  code: string;
  name: string;
  type: number;
  value: number;
  minAmount: number;
  status: number;
  validFrom: string;
  validTo: string;
}

export default function MarketingPage() {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "1",
    value: "",
    minAmount: "",
    validFrom: "",
    validTo: "",
  });
  const [adjust, setAdjust] = useState({ userId: "", points: "", balance: "" });

  const load = async () => {
    try {
      const data = await adminFetch<Coupon[]>("/api/admin/server/marketing/coupons");
      setCoupons(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<Coupon[]>("/api/admin/server/marketing/coupons");
        setCoupons(data);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const createCoupon = async () => {
    try {
      await adminFetch("/api/admin/server/marketing/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          type: Number(form.type),
          value: Number(form.value),
          minAmount: Number(form.minAmount),
          status: 1,
          validFrom: form.validFrom,
          validTo: form.validTo,
        }),
      });
      setForm({ code: "", name: "", type: "1", value: "", minAmount: "", validFrom: "", validTo: "" });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      await adminFetch(`/api/admin/server/marketing/coupons/${coupon.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: coupon.status === 1 ? 0 : 1 }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const adjustAccount = async () => {
    try {
      await adminFetch(`/api/admin/server/marketing/accounts/${adjust.userId}/adjust`, {
        method: "POST",
        body: JSON.stringify({
          points: Number(adjust.points || 0),
          balance: Number(adjust.balance || 0),
        }),
      });
      setAdjust({ userId: "", points: "", balance: "" });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("admin.marketing.title")}
        description={t("admin.marketing.desc")}
      />

      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
          <div className="border-b border-ikea-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">{t("admin.marketing.couponList")}</h2>
          </div>
          {!coupons ? (
            <Loading />
          ) : coupons.length === 0 ? (
            <EmptyState>{t("admin.marketing.emptyCoupons")}</EmptyState>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colCode")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colName")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colType")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colThreshold")}</th>
                  <th className="px-5 py-3 font-medium">{t("admin.marketing.colStatus")}</th>
                  <th className="px-5 py-3 text-right font-medium">
                    {t("admin.common.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ikea-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-ikea-gray-50">
                    <td className="px-5 py-3 font-medium">{coupon.code}</td>
                    <td className="px-5 py-3">{coupon.name}</td>
                    <td className="px-5 py-3">
                      {coupon.type === 2
                        ? t("admin.marketing.discount")
                        : t("admin.marketing.off")}
                    </td>
                    <td className="px-5 py-3">
                      {coupon.minAmount} / {coupon.value}
                      {coupon.type === 2 ? "%" : ""}
                    </td>
                    <td className="px-5 py-3">
                      {coupon.status === 1
                        ? t("admin.marketing.enabled")
                        : t("admin.marketing.disabled")}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" onClick={() => toggleCoupon(coupon)}>
                        {coupon.status === 1
                          ? t("admin.marketing.disable")
                          : t("admin.marketing.enable")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">{t("admin.marketing.newCoupon")}</h2>
            <div className="mt-4 space-y-3">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t("admin.marketing.placeholderCode")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("admin.marketing.colName")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue">
                <option value="1">{t("admin.marketing.off")}</option>
                <option value="2">{t("admin.marketing.discount")}</option>
              </select>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={t("admin.marketing.placeholderValue")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder={t("admin.marketing.placeholderMin")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} placeholder={t("admin.marketing.placeholderValidFrom")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} placeholder={t("admin.marketing.placeholderValidTo")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <Button onClick={() => void createCoupon()}>{t("admin.marketing.createCoupon")}</Button>
            </div>
          </section>

          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">{t("admin.marketing.adjustAccount")}</h2>
            <div className="mt-4 space-y-3">
              <input value={adjust.userId} onChange={(e) => setAdjust({ ...adjust, userId: e.target.value })} placeholder={t("admin.marketing.placeholderUserId")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={adjust.points} onChange={(e) => setAdjust({ ...adjust, points: e.target.value })} placeholder={t("admin.marketing.placeholderPoints")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={adjust.balance} onChange={(e) => setAdjust({ ...adjust, balance: e.target.value })} placeholder={t("admin.marketing.placeholderBalance")} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <Button onClick={() => void adjustAccount()}>{t("admin.marketing.saveAdjust")}</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
