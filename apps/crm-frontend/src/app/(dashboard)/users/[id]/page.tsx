"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useUpdateUser, useDeleteUser } from "@/lib/hooks/use-users";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useHasRole } from "@/components/auth/role-guard";
import { UserForm } from "@/features/users/components/user-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Loader2, Shield, ShieldCheck, UserRoundCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import type { UserRole } from "@/types";
import type { UserUpdateFormValues } from "@/lib/validators/user";

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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { t } = useTranslation();

  const currentUserId = useAuthStore((s) => s.user?.id);
  const isAdmin = useHasRole(["admin"]);
  const token = useAuthStore((s) => s.token);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: user, isLoading, isError, error } = useUser(id);

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const isSelf = currentUserId === id;

  // Redirect non-admin users away from this page
  useEffect(() => {
    if (token && !isAdmin) {
      router.replace("/");
    }
  }, [token, isAdmin, router]);

  // If not admin, show nothing while redirecting
  if (!isAdmin) {
    return null;
  }

  const handleUpdate = (values: UserUpdateFormValues) => {
    updateUser.mutate(
      { id, ...values },
      {
        onSuccess: () => {
          setFormOpen(false);
          toast.success(t("users.userUpdated", { name: user?.full_name ?? user?.email }));
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : t("users.updateError")
          );
        },
      }
    );
  };

  const handleDelete = () => {
    deleteUser.mutate(id, {
      onSuccess: () => {
        toast.success(t("users.userDeleted", { name: user?.full_name ?? user?.email }));
        router.push("/users");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : t("users.deleteError")
        );
        setDeleteDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("users.backToList")}
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            {t("users.userNotFound")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : t("users.loadErrorDetail")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("users.backToList")}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFormOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isSelf || deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isSelf ? t("users.cannotDeleteSelf") : t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* User Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {user.full_name ?? user.email}
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <RoleBadge role={user.role} />
          <Badge variant={user.is_active ? "default" : "secondary"}>
            {user.is_active ? t("forms.active") : t("forms.inactive")}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("users.detailTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label={t("users.fullName")} value={user.full_name} />
            <DetailRow label={t("users.email")} value={user.email} />
            <DetailRow
              label={t("users.role")}
              value={t(`users.roles.${user.role}`)}
            />
            <DetailRow
              label={t("users.status")}
              value={
                user.is_active ? t("forms.active") : t("forms.inactive")
              }
            />
            <DetailRow
              label={t("users.created")}
              value={formatDate(user.created_at)}
            />
            <DetailRow
              label={t("users.updated")}
              value={formatDate(user.updated_at)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("users.metadata")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="ID" value={user.id} />
            <DetailRow
              label="Email Verified"
              value={user.email_verified ? "Yes" : "No"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Form Dialog */}
      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleUpdate}
        user={user}
        isSubmitting={updateUser.isPending}
        isAdmin={isAdmin}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("users.deleteConfirmTitle")}
        description={t("users.deleteConfirmDesc", {
          name: user.full_name ?? user.email,
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteUser.isPending}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm mt-0.5">{value || "—"}</p>
    </div>
  );
}
