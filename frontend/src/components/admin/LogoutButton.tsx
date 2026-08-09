"use client";

import { Button } from "@/components/admin/admin-ui";

export function LogoutButton() {
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await fetch("/api/admin/auth/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
    >
      退出登录
    </Button>
  );
}
