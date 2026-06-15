"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

function AccessDeniedFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <ShieldAlert className="h-12 w-12 text-muted-foreground" />
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">{t("rbac.accessDenied")}</h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t("rbac.accessDeniedDesc")}
        </p>
      </div>
      <Button variant="outline" asChild>
        <a href="/">Go to Dashboard</a>
      </Button>
    </div>
  );
}

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard role="admin" fallback={<AccessDeniedFallback />}>
      {children}
    </RoleGuard>
  );
}
