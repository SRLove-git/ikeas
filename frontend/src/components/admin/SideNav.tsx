"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/admin/admin-ui";

export interface NavItem {
  href: string;
  label: string;
  badge?: string;
}

export interface NavGroup {
  title: string;
  description?: string;
  items: NavItem[];
}

export function SideNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.title}>
          <div className="px-2 pb-0.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200/70">
              {group.title}
            </div>
            {group.description ? (
              <div className="mt-0.5 text-[10px] text-blue-200/40">{group.description}</div>
            ) : null}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-white/15 font-semibold text-white"
                        : "text-blue-100/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
