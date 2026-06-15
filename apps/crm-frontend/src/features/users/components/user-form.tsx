"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  userUpdateSchema,
  type UserUpdateFormValues,
} from "@/lib/validators/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/lib/i18n";
import { USER_ROLES } from "@/types";
import type { User } from "@/types";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserUpdateFormValues) => void;
  user: User;
  isSubmitting?: boolean;
  isAdmin?: boolean;
}

export function UserForm({
  open,
  onOpenChange,
  onSubmit,
  user,
  isSubmitting = false,
  isAdmin = false,
}: UserFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserUpdateFormValues>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      full_name: user.full_name ?? "",
      role: user.role as UserUpdateFormValues["role"],
      is_active: user.is_active,
    },
  });

  const selectedRole = watch("role");
  const isActive = watch("is_active");

  const handleFormSubmit = (values: UserUpdateFormValues) => {
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("users.editUser")}</DialogTitle>
          <DialogDescription>
            {t("users.editUserDesc", { email: user.email })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("users.fullName")} *</Label>
            <Input
              id="full_name"
              placeholder={t("users.fullNamePlaceholder")}
              {...register("full_name", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">{t("users.email")}</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>

          {/* Role — only admins can change roles */}
          {isAdmin ? (
            <div className="space-y-2">
              <Label htmlFor="role">{t("users.role")}</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) =>
                  setValue("role", v as UserUpdateFormValues["role"])
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {t(`users.roles.${role}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("users.role")}</Label>
              <Input
                value={t(`users.roles.${user.role}`)}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-sm font-medium">
                {t("users.activeStatus")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isActive
                  ? t("users.activeStatusDesc")
                  : t("users.inactiveStatusDesc")}
              </p>
            </div>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={(v) => setValue("is_active", v)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
