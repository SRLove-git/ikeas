import Link from "next/link"
import { LogoutButton } from "@/components/admin/LogoutButton"
import { SideNav, type NavGroup } from "@/components/admin/SideNav"

const NAV_GROUPS: NavGroup[] = [
  {
    title: "总览",
    items: [{ href: "/admin", label: "仪表盘" }],
  },
  {
    title: "商品中心",
    description: "商品、分类与落地页",
    items: [
      { href: "/admin/products", label: "商品管理" },
      { href: "/admin/categories", label: "商品分类" },
      { href: "/admin/catalog-pages", label: "分类落地页" },
    ],
  },
  {
    title: "内容中心",
    description: "首页、页面、菜单与客服知识",
    items: [
      { href: "/admin/homepage", label: "首页管理" },
      { href: "/admin/pages", label: "页面内容" },
      { href: "/admin/menu", label: "导航菜单" },
      { href: "/admin/chat-knowledge", label: "客服知识库" },
    ],
  },
  {
    title: "交易与客户",
    description: "订单、用户与互动数据",
    items: [
      { href: "/admin/orders", label: "订单管理" },
      { href: "/admin/users", label: "用户管理" },
      { href: "/admin/carts", label: "购物车" },
      { href: "/admin/favorites", label: "收藏" },
      { href: "/admin/chat", label: "客服聊天" },
    ],
  },
  {
    title: "营销中心",
    description: "优惠券、会员账户与权益",
    items: [{ href: "/admin/marketing", label: "营销与会员" }],
  },
  {
    title: "系统设置",
    description: "站点配置与审计",
    items: [
      { href: "/admin/settings", label: "网站设置" },
      { href: "/admin/changelog", label: "操作日志" },
    ],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ikea-gray-100 text-ikea-black">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col bg-blue-950">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-ikea-blue text-sm font-black text-white">
            B
          </div>
          <div>
            <div className="text-sm font-bold text-white">BUZUD 内容管理后台</div>
            <div className="text-[10px] text-blue-200/70">CMS · 实时生效</div>
          </div>
        </div>
        <SideNav groups={NAV_GROUPS} />
        <div className="border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="mb-2 block rounded-md bg-white/10 px-2.5 py-2 text-center text-xs font-medium text-white hover:bg-white/20"
          >
            查看网站 ↗
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="ml-56 flex-1 px-8 py-8">{children}</main>
    </div>
  )
}
