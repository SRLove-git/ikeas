"use client";

import { Button } from "@/components/admin/admin-ui";
import { useTranslation } from "react-i18next";

export function LogoutButton() {
  const { t } = useTranslation();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await fetch("/api/admin/auth/logout", { method: "POST" });
        window.location.href = "/admin/login";
      }}
    >
      {t("admin.logout")}
    </Button>
  );
}
