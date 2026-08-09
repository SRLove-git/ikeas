"use client";

import { useCallback, useEffect, useState } from "react";
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
    show("success", "用户已删除");
    await load();
  };

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="Spring Boot 后端注册的用户（登录账号）。"
      />
      <NoticeArea notice={notice} />
      {error ? (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      ) : null}
      <div className="overflow-hidden rounded-lg border border-ikea-gray-200 bg-white">
        {!users ? (
          <Loading label="连接运营服务…" />
        ) : users.length === 0 ? (
          <EmptyState>暂无用户</EmptyState>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ikea-gray-200 bg-ikea-gray-50 text-xs text-ikea-muted">
              <tr>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">手机</th>
                <th className="px-5 py-3 font-medium">邮箱</th>
                <th className="px-5 py-3 font-medium">注册时间</th>
                <th className="px-5 py-3 text-right font-medium">操作</th>
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
                    {new Date(user.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ConfirmButton onConfirm={() => remove(user.id)}>
                      删除用户
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
