"use client";

import { useEffect, useState } from "react";
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
    void load();
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
        title="营销与会员"
        description="管理优惠券、会员积分与余额。"
      />

      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
          <div className="border-b border-ikea-gray-200 px-5 py-4">
            <h2 className="text-base font-bold">优惠券列表</h2>
          </div>
          {!coupons ? (
            <Loading />
          ) : coupons.length === 0 ? (
            <EmptyState>暂无优惠券</EmptyState>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-ikea-gray-50 text-xs text-ikea-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">编码</th>
                  <th className="px-5 py-3 font-medium">名称</th>
                  <th className="px-5 py-3 font-medium">类型</th>
                  <th className="px-5 py-3 font-medium">门槛/面额</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ikea-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-ikea-gray-50">
                    <td className="px-5 py-3 font-medium">{coupon.code}</td>
                    <td className="px-5 py-3">{coupon.name}</td>
                    <td className="px-5 py-3">{coupon.type === 2 ? "折扣" : "满减"}</td>
                    <td className="px-5 py-3">
                      {coupon.minAmount} / {coupon.value}
                      {coupon.type === 2 ? "%" : ""}
                    </td>
                    <td className="px-5 py-3">{coupon.status === 1 ? "启用" : "停用"}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="secondary" onClick={() => toggleCoupon(coupon)}>
                        {coupon.status === 1 ? "停用" : "启用"}
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
            <h2 className="text-base font-bold">新建优惠券</h2>
            <div className="mt-4 space-y-3">
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="券码" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="名称" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue">
                <option value="1">满减</option>
                <option value="2">折扣</option>
              </select>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="面额 / 折扣百分比" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="最低消费金额" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} placeholder="生效时间" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} placeholder="失效时间" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <Button onClick={() => void createCoupon()}>创建优惠券</Button>
            </div>
          </section>

          <section className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <h2 className="text-base font-bold">调整会员账户</h2>
            <div className="mt-4 space-y-3">
              <input value={adjust.userId} onChange={(e) => setAdjust({ ...adjust, userId: e.target.value })} placeholder="用户 ID" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={adjust.points} onChange={(e) => setAdjust({ ...adjust, points: e.target.value })} placeholder="积分增量（可为负数）" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <input value={adjust.balance} onChange={(e) => setAdjust({ ...adjust, balance: e.target.value })} placeholder="余额增量（可为负数）" className="h-10 w-full border border-ikea-gray-200 px-3 text-sm outline-none focus:border-ikea-blue" />
              <Button onClick={() => void adjustAccount()}>保存调整</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
