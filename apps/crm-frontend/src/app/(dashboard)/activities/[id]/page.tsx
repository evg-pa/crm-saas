"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useActivity, useUpdateActivity, useDeleteActivity } from "@/lib/hooks/use-activities";
import { useContact } from "@/lib/hooks/use-contacts";
import { useDeal } from "@/lib/hooks/use-deals";
import { ActivityForm } from "@/features/activities/components/activity-form";
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
import { ArrowLeft, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useLocale } from "@/lib/i18n/use-locale";
import type { ActivityFormValues } from "@/lib/validators/activity";
import { toast } from "sonner";

// Distinct badge colors per activity type
const activityTypeStyles: Record<string, string> = {
  call: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  email: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  task: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  follow_up: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

const ACTIVITY_TYPE_KEYS: Record<string, string> = {
  call: "activityTypes.call",
  email: "activityTypes.email",
  meeting: "activityTypes.meeting",
  note: "activityTypes.note",
  task: "activityTypes.task",
  follow_up: "activityTypes.follow_up",
};

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { t } = useTranslation();
  const { locale } = useLocale();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: activity, isLoading, isError, error } = useActivity(id);
  const { data: contact } = useContact(activity?.contact_id ?? "");
  const { data: deal } = useDeal(activity?.deal_id ?? "");

  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const handleUpdate = (values: ActivityFormValues) => {
    updateActivity.mutate(
      {
        id,
        ...values,
        occurred_at: new Date(values.occurred_at).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success(t("activities.activityUpdated", { name: values.subject }));
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : t("activities.updateError")
          );
        },
      }
    );
  };

  const handleDelete = () => {
    deleteActivity.mutate(id, {
      onSuccess: () => {
        toast.success(t("activities.activityDeleted", { name: activity?.subject ?? "" }));
        router.push("/activities");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : t("activities.deleteError")
        );
        setDeleteConfirmOpen(false);
      },
    });
  };

  const typeLabel = (type: string): string => {
    const key = ACTIVITY_TYPE_KEYS[type];
    if (!key) return type;
    const translated = t(key);
    return translated !== key ? translated : type;
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

  if (isError || !activity) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/activities")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("activities.backToList")}
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            {t("activities.loadError")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : t("activities.notFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/activities")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("activities.backToList")}
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
              {t("activities.editActivity")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("activities.deleteActivity")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Activity Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {activity.subject}
          </h1>
          <Badge
            className={
              activityTypeStyles[activity.activity_type] ??
              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }
            variant="outline"
          >
            {typeLabel(activity.activity_type)}
          </Badge>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("activities.detailTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label={t("activities.type")} value={typeLabel(activity.activity_type)} />
            <DetailRow label={t("activities.descField")} value={activity.description} />
            <DetailRow label={t("activities.contact")} value={contact ? `${contact.first_name} ${contact.last_name}` : null} />
            <DetailRow label={t("activities.deal")} value={deal?.name ?? null} />
            <DetailRow
              label={t("activities.date")}
              value={formatDate(activity.occurred_at, locale, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("activities.metadata")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label={t("activities.created")} value={formatDate(activity.created_at, locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} />
            <DetailRow label={t("activities.updated")} value={formatDate(activity.updated_at, locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} />
          </CardContent>
        </Card>
      </div>

      {/* Description card (full width when long) */}
      {activity.description && activity.description.length > 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("activities.descField")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {activity.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Form Dialog */}
      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleUpdate}
        activity={activity}
        isSubmitting={updateActivity.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t("activities.deleteConfirmTitle")}
        description={t("activities.deleteConfirmDesc")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteActivity.isPending}
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
