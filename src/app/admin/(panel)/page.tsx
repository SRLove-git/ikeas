"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const ACTION_LABEL: Record<string, string> = {
  create: "创建",
  update: "更新",
  delete: "删除",
};

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

function moduleGroups(stats: SiteStats): { title: string; description: string; items: ModuleEntry[] }[] {
  return [
    {
      title: "商品中心",
      description: "商品、分类与落地页",
      items: [
        { href: "/admin/products", label: "商品管理", description: "名称、价格、图片、标签、详情", count: String(stats.products) },
        { href: "/admin/categories", label: "商品分类", description: "商品分类与频道分类" },
        { href: "/admin/catalog-pages", label: "分类落地页", description: "分类页标题、描述与商品", count: String(stats.catalogPages) },
      ],
    },
    {
      title: "内容中心",
      description: "首页、页面、菜单与客服知识",
      items: [
        { href: "/admin/homepage", label: "首页管理", description: "轮播、促销、榜单、页脚等区块" },
        { href: "/admin/pages", label: "页面内容", description: "房间、灵感、活动、客服、门店等", count: String(stats.pages) },
        { href: "/admin/menu", label: "导航菜单", description: "顶部下拉菜单与分类菜单" },
        { href: "/admin/chat-knowledge", label: "客服知识库", description: "机器人自动回复规则" },
      ],
    },
    {
      title: "交易与客户",
      description: "订单、用户与互动数据",
      items: [
        { href: "/admin/orders", label: "订单管理", description: "订单状态、商品与客户", count: String(stats.orders) },
        { href: "/admin/users", label: "用户管理", description: "注册用户账号" },
        { href: "/admin/carts", label: "购物车", description: "用户购物袋" },
        { href: "/admin/favorites", label: "收藏", description: "用户收藏商品" },
        { href: "/admin/chat", label: "客服聊天", description: "客服问答记录" },
      ],
    },
    {
      title: "系统设置",
      description: "站点配置与审计",
      items: [
        { href: "/admin/settings", label: "网站设置", description: "站点名称、SEO 与页面文案" },
        { href: "/admin/changelog", label: "操作日志", description: "后台修改记录" },
      ],
    },
  ];
}

export default function AdminDashboardPage() {
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
        <PageHeader title="仪表盘" />
        <Notice kind="error">{error}</Notice>
      </div>
    );
  }
  if (!stats) return <Loading label="正在加载统计数据…" />;

  const cards = [
    { label: "商品总数", value: stats.products, href: "/admin/products" },
    { label: "内容页面", value: stats.pages, href: "/admin/pages" },
    { label: "分类落地页", value: stats.catalogPages, href: "/admin/catalog-pages" },
    { label: "订单", value: stats.orders, href: "/admin/orders" },
  ];

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="仪表盘"
        description="网站内容总览。所有修改即时写入内容数据库并在前台生效。"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <div className="rounded-lg border border-ikea-gray-200 bg-white p-5 transition hover:border-ikea-blue">
              <div className="text-xs text-ikea-muted">{card.label}</div>
              <div className="mt-1 text-3xl font-bold text-ikea-black">
                {card.value.toLocaleString("zh-CN")}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {moduleGroups(stats).map((group) => (
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
          <div className="text-sm font-bold text-ikea-black">运营服务（Spring Boot）</div>
          {serverStats ? (
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              在线 · {String(serverStats.users ?? "-")} 用户
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
              离线（用户/购物车/收藏/聊天功能不可用）
            </span>
          )}
        </div>
        {serverStats ? (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ikea-muted">
            <span>用户 {String(serverStats.users ?? "-")}</span>
            <span>购物车 {String(serverStats.carts ?? "-")}</span>
            <span>收藏 {String(serverStats.favorites ?? "-")}</span>
            <span>聊天记录 {String(serverStats.chatMessages ?? "-")}</span>
          </div>
        ) : null}
      </div>

      <Card
        title="最近操作"
        actions={
          <Link href="/admin/changelog" className="text-xs text-ikea-blue hover:underline">
            查看全部
          </Link>
        }
      >
        {changelog.length === 0 ? (
          <EmptyState>还没有操作记录</EmptyState>
        ) : (
          <ul className="divide-y divide-ikea-gray-200">
            {changelog.slice(0, 8).map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    ACTION_COLOR[entry.action] ?? "bg-ikea-gray-100 text-ikea-muted"
                  }`}
                >
                  {ACTION_LABEL[entry.action] ?? entry.action}
                </span>
                <span className="flex-1 truncate">{entry.summary}</span>
                <span className="shrink-0 text-xs text-ikea-muted">
                  {new Date(entry.at).toLocaleString("zh-CN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
