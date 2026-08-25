"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/LanguageProvider";
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

interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { notice, show } = useNotice();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ items: User[] }>("/api/admin/server/users");
      setUsers(data.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const remove = async (id: string) => {
    await adminFetch(`/api/admin/server/users/${id}`, { method: "DELETE" });
    show("success", t("admin.users.deleted"));
    await load();
  };

  return (
    <div>
      <PageHeader
        title={t("admin.users.title")}
        description={t("admin.users.desc")}
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!users ? (
          <Loading label={t("admin.users.loading")} />
        ) : users.length === 0 ? (
          <EmptyState>{t("admin.users.empty")}</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t("admin.users.colUser")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.users.colPhone")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.users.colEmail")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.users.colCreatedAt")}</th>
                <th className="px-5 py-3 text-right font-medium">
                  {t("admin.common.colActions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-ikea-black">{user.name}</div>
                    <div className="text-xs text-ikea-muted">{user.id}</div>
                  </td>
                  <td className="px-5 py-3 text-xs">{user.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-xs">{user.email ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {new Date(user.createdAt).toLocaleString(locale === "en" ? "en-SG" : "zh-CN")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ConfirmButton onConfirm={() => remove(user.id)}>
                      {t("admin.users.deleteUser")}
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
