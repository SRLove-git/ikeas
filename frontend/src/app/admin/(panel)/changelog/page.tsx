"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/LanguageProvider";
import {
  adminFetch,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";

interface ChangelogEntry {
  id: string;
  at: string;
  user: string;
  action: "create" | "update" | "delete";
  resource: string;
  target: string;
  summary: string;
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};

export default function ChangelogPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const ACTION_LABEL: Record<string, string> = {
    create: t("admin.changelog.actionCreate"),
    update: t("admin.changelog.actionUpdate"),
    delete: t("admin.changelog.actionDelete"),
  };
  const RESOURCE_LABEL: Record<string, string> = {
    product: t("admin.changelog.resourceProduct"),
    page: t("admin.changelog.resourcePage"),
    homepage: t("admin.changelog.resourceHomepage"),
    menu: t("admin.changelog.resourceMenu"),
    categories: t("admin.changelog.resourceCategories"),
    "catalog-page": t("admin.changelog.resourceCatalogPage"),
    order: t("admin.changelog.resourceOrder"),
    settings: t("admin.changelog.resourceSettings"),
  };
  const [items, setItems] = useState<ChangelogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminFetch<{ items: ChangelogEntry[] }>("/api/admin/changelog");
        setItems(data.items);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  return (
    <div>
      <PageHeader
        title={t("admin.changelog.title")}
        description={t("admin.changelog.desc")}
      />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!items ? (
          <Loading />
        ) : items.length === 0 ? (
          <EmptyState>{t("admin.changelog.empty")}</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{t("admin.changelog.colTime")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.changelog.colAction")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.changelog.colResource")}</th>
                <th className="px-5 py-3 font-medium">{t("admin.changelog.colSummary")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ikea-gray-200">
              {items.map((entry) => (
                <tr key={entry.id} className="hover:bg-ikea-gray-50">
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {new Date(entry.at).toLocaleString(locale === "en" ? "en-SG" : "zh-CN")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        ACTION_COLOR[entry.action] ?? "bg-ikea-gray-100 text-ikea-muted"
                      }`}
                    >
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ikea-muted">
                    {RESOURCE_LABEL[entry.resource] ?? entry.resource}
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-ikea-black">{entry.summary}</div>
                    <div className="text-xs text-ikea-muted">{entry.target}</div>
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
