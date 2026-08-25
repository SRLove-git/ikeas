"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/i18n/LanguageProvider";
import {
  adminFetch,
  Card,
  EmptyState,
  Loading,
  Notice,
  PageHeader,
} from "@/components/admin/admin-ui";

interface SiteStats {
  products: number;
  pages: number;
  pageFamilies: { name: string; count: number }[];
  catalogPages: number;
  orders: number;
  updatedAt: string;
}

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

interface ModuleEntry {
  href: string;
  label: string;
  description: string;
  count?: string;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [serverStats, setServerStats] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [statsData, logData] = await Promise.all([
          adminFetch<SiteStats>("/api/admin/stats"),
          adminFetch<{ items: ChangelogEntry[] }>("/api/admin/changelog"),
        ]);
        setStats(statsData);
        setChangelog(logData.items);
      } catch (e) {
        setError((e as Error).message);
      }
      try {
        const data = await adminFetch<Record<string, unknown>>(
          "/api/admin/server/stats",
        );
        setServerStats(data);
      } catch {
        setServerStats(null);
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={t("admin.dashboard.title")} />
        <Notice kind="error">{error}</Notice>
      </div>
    );
  }
  if (!stats) return <Loading label={t("admin.dashboard.loading")} />;

  const cards = [
    { label: t("admin.dashboard.productTotal"), value: stats.products, href: "/admin/products" },
    { label: t("admin.dashboard.contentPages"), value: stats.pages, href: "/admin/pages" },
    {
      label: t("admin.dashboard.catalogPages"),
      value: stats.catalogPages,
      href: "/admin/catalog-pages",
    },
    { label: t("admin.dashboard.orders"), value: stats.orders, href: "/admin/orders" },
  ];

  const actionLabel: Record<string, string> = {
    create: t("admin.dashboard.actionCreate"),
    update: t("admin.dashboard.actionUpdate"),
    delete: t("admin.dashboard.actionDelete"),
  };

  const moduleGroups: {
    title: string;
    description: string;
    items: ModuleEntry[];
  }[] = [
    {
      title: t("admin.shell.products"),
      description: t("admin.shell.productsDesc"),
      items: [
        {
          href: "/admin/products",
          label: t("admin.dashboard.mProducts"),
          description: t("admin.dashboard.mProductsDesc"),
          count: String(stats.products),
        },
        {
          href: "/admin/categories",
          label: t("admin.dashboard.mCategories"),
          description: t("admin.dashboard.mCategoriesDesc"),
        },
        {
          href: "/admin/catalog-pages",
          label: t("admin.dashboard.mCatalogPages"),
          description: t("admin.dashboard.mCatalogPagesDesc"),
          count: String(stats.catalogPages),
        },
      ],
    },
    {
      title: t("admin.shell.content"),
      description: t("admin.shell.contentDesc"),
      items: [
        {
          href: "/admin/homepage",
          label: t("admin.dashboard.mHomepage"),
          description: t("admin.dashboard.mHomepageDesc"),
        },
        {
          href: "/admin/pages",
          label: t("admin.dashboard.mPages"),
          description: t("admin.dashboard.mPagesDesc"),
          count: String(stats.pages),
        },
        {
          href: "/admin/menu",
          label: t("admin.dashboard.mMenu"),
          description: t("admin.dashboard.mMenuDesc"),
        },
        {
          href: "/admin/chat-knowledge",
          label: t("admin.dashboard.mChatKnowledge"),
          description: t("admin.dashboard.mChatKnowledgeDesc"),
        },
      ],
    },
    {
      title: t("admin.shell.trading"),
      description: t("admin.shell.tradingDesc"),
      items: [
        {
          href: "/admin/orders",
          label: t("admin.dashboard.mOrders"),
          description: t("admin.dashboard.mOrdersDesc"),
          count: String(stats.orders),
        },
        {
          href: "/admin/users",
          label: t("admin.dashboard.mUsers"),
          description: t("admin.dashboard.mUsersDesc"),
        },
        {
          href: "/admin/carts",
          label: t("admin.dashboard.mCarts"),
          description: t("admin.dashboard.mCartsDesc"),
        },
        {
          href: "/admin/favorites",
          label: t("admin.dashboard.mFavorites"),
          description: t("admin.dashboard.mFavoritesDesc"),
        },
        {
          href: "/admin/chat",
          label: t("admin.dashboard.mChat"),
          description: t("admin.dashboard.mChatDesc"),
        },
      ],
    },
    {
      title: t("admin.shell.system"),
      description: t("admin.shell.systemDesc"),
      items: [
        {
          href: "/admin/settings",
          label: t("admin.dashboard.mSettings"),
          description: t("admin.dashboard.mSettingsDesc"),
        },
        {
          href: "/admin/changelog",
          label: t("admin.dashboard.mChangelog"),
          description: t("admin.dashboard.mChangelogDesc"),
        },
      ],
    },
  ];

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={t("admin.dashboard.title")}
        description={t("admin.dashboard.desc")}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="rounded-lg border border-ikea-gray-200 bg-white p-5 transition hover:border-ikea-blue">
              <div className="text-xs text-ikea-muted">{card.label}</div>
              <div className="mt-1 text-3xl font-bold text-ikea-black">
                {card.value.toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {moduleGroups.map((group) => (
          <div key={group.title} className="rounded-lg border border-ikea-gray-200 bg-white p-5">
            <div className="mb-1 text-sm font-bold text-ikea-black">{group.title}</div>
            <div className="mb-4 text-xs text-ikea-muted">{group.description}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-md border border-ikea-gray-200 p-3 transition-colors hover:border-ikea-blue"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ikea-black group-hover:text-ikea-blue">
                      {item.label}
                    </span>
                    {item.count ? (
                      <span className="text-xs font-bold text-ikea-muted">{item.count}</span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 text-xs text-ikea-muted">{item.description}</div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-ikea-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-ikea-black">{t("admin.dashboard.serverService")}</div>
          {serverStats ? (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              {t("admin.dashboard.onlineUsers", { count: String(serverStats.users ?? "-") })}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              {t("admin.dashboard.offline")}
            </span>
          )}
        </div>
        {serverStats ? (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ikea-muted">
            <span>
              {t("admin.dashboard.serverUsers", { count: String(serverStats.users ?? "-") })}
            </span>
            <span>
              {t("admin.dashboard.serverCarts", { count: String(serverStats.carts ?? "-") })}
            </span>
            <span>
              {t("admin.dashboard.serverFavorites", {
                count: String(serverStats.favorites ?? "-"),
              })}
            </span>
            <span>
              {t("admin.dashboard.serverChats", {
                count: String(serverStats.chatMessages ?? "-"),
              })}
            </span>
          </div>
        ) : null}
      </div>

      <Card
        title={t("admin.dashboard.recentActions")}
        actions={
          <Link href="/admin/changelog" className="text-xs text-ikea-blue hover:underline">
            {t("admin.dashboard.viewAll")}
          </Link>
        }
      >
        {changelog.length === 0 ? (
          <EmptyState>{t("admin.dashboard.noActions")}</EmptyState>
        ) : (
          <ul className="divide-y divide-ikea-gray-200">
            {changelog.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    ACTION_COLOR[entry.action] ?? "bg-ikea-gray-100 text-ikea-muted"
                  }`}
                >
                  {actionLabel[entry.action] ?? entry.action}
                </span>
                <span className="flex-1 truncate">{entry.summary}</span>
                <span className="shrink-0 text-xs text-ikea-muted">
                  {new Date(entry.at).toLocaleString(locale === "en" ? "en-SG" : "zh-CN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
