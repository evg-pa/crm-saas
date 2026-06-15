"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useUsers, useDeleteUser } from "@/lib/hooks/use-users";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  PageHeader,
  SearchInput,
  DataTable,
  EmptyState,
} from "@/components/shared";
import { useTranslation } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { User, UserRole } from "@/types";

const ROLE_ICON_MAP: Record<UserRole, typeof Shield> = {
  admin: ShieldCheck,
  manager: UserRoundCheck,
  member: Shield,
};

function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useTranslation();
  const Icon = ROLE_ICON_MAP[role] ?? Shield;
  return (
    <Badge variant="secondary" className="inline-flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {t(`users.roles.${role}`)}
    </Badge>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const limit = 20;
  const { data, isLoading, isError, error } = useUsers({
    q: search || undefined,
    offset: page * limit,
    limit,
  });

  const currentUserId = useAuthStore((s) => s.user?.id);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const deleteUser = useDeleteUser();

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(
          t("users.userDeleted", {
            name: deleteTarget.full_name ?? deleteTarget.email,
          })
        );
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : t("users.deleteError")
        );
        setDeleteTarget(null);
      },
    });
  }, [deleteUser, deleteTarget, t]);

  const handleDeleteClick = useCallback(
    (user: User) => {
      if (user.id === currentUserId) {
        toast.error(t("users.cannotDeleteSelf"));
        return;
      }
      setDeleteTarget(user);
    },
    [currentUserId, t]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const USER_COLUMNS: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: t("users.fullName"),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.full_name ?? t("common.none")}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: t("users.email"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "role",
        header: t("users.role"),
        cell: ({ getValue }) => (
          <RoleBadge role={getValue<UserRole>()} />
        ),
      },
      {
        accessorKey: "is_active",
        header: t("users.status"),
        cell: ({ getValue }) => {
          const active = getValue<boolean>();
          return (
            <Badge variant={active ? "default" : "secondary"}>
              {active ? t("forms.active") : t("forms.inactive")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: t("users.created"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(getValue<User["created_at"]>(), locale)}
          </span>
        ),
      },
    ],
    [t, locale]
  );

  const emptyState = useMemo(
    () => (
      <EmptyState
        icon={Users}
        title={t("users.noUsers")}
        description={t("users.noUsersDesc")}
      />
    ),
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={
          data
            ? t("users.description", { count: data.total })
            : t("users.noDescription")
        }
      />

      <SearchInput
        placeholder={t("users.searchPlaceholder")}
        value={search}
        onChange={handleSearchChange}
        className="max-w-md"
      />

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            {t("users.loadError")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error
              ? error.message
              : t("users.loadErrorDetail")}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("users.deleteConfirmTitle")}
        description={
          deleteTarget
            ? t("users.deleteConfirmDesc", {
                name: deleteTarget.full_name ?? deleteTarget.email,
              })
            : ""
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteUser.isPending}
      />

      {!isError && (
        <>
          <DataTable
            columns={USER_COLUMNS}
            data={data?.items ?? []}
            isLoading={isLoading}
            onRowClick={(user) => router.push(`/users/${user.id}`)}
            rowActions={[
              {
                label: t("common.edit"),
                onClick: (user) => router.push(`/users/${user.id}`),
              },
              {
                label: t("common.delete"),
                onClick: handleDeleteClick,
                variant: "destructive",
              },
            ]}
            emptyState={emptyState}
          />

          {data && data.total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("common.showing")} {page * limit + 1}–
                {Math.min((page + 1) * limit, data.total)} {t("common.of")}{" "}
                {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("common.next")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
