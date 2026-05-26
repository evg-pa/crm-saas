"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActivities, useCreateActivity } from "@/lib/hooks/use-activities";
import { ActivityForm } from "@/features/activities/components/activity-form";
import { useContact } from "@/lib/hooks/use-contacts";
import { useDeal } from "@/lib/hooks/use-deals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Activity } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { Activity as ActivityType } from "@/types";
import type { ActivityFormValues } from "@/lib/validators/activity";
import { useTranslation } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  PageHeader,
  SearchInput,
  DataTable,
  EmptyState,
} from "@/components/shared";

// Distinct badge colors per activity type
const activityTypeStyles: Record<string, string> = {
  call: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  email: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  task: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  follow_up: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

// Fallback activity type labels (used when translation key lookup fails)
const ACTIVITY_TYPE_KEYS: Record<string, string> = {
  call: "activityTypes.call",
  email: "activityTypes.email",
  meeting: "activityTypes.meeting",
  note: "activityTypes.note",
  task: "activityTypes.task",
  follow_up: "activityTypes.follow_up",
};

const ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPE_KEYS);

export default function ActivitiesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const limit = 20;
  const { data, isLoading, isError, error } = useActivities({
    q: search || undefined,
    activity_type: activityTypeFilter !== "all" ? activityTypeFilter : undefined,
    offset: page * limit,
    limit,
  });

  const createActivity = useCreateActivity();

  const handleCreate = useCallback(
    (values: ActivityFormValues) => {
      createActivity.mutate(
        {
          ...values,
          occurred_at: new Date(values.occurred_at).toISOString(),
        },
        {
          onSuccess: (data) => {
            toast.success(
              t("activities.activityCreated", { name: data.subject })
            );
            setFormOpen(false);
          },
          onError: (err) =>
            toast.error(
              err instanceof Error
                ? err.message
                : t("activities.createError")
            ),
        }
      );
    },
    [createActivity, t]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const typeLabel = useCallback(
    (type: string): string => {
      const key = ACTIVITY_TYPE_KEYS[type];
      if (!key) return type;
      const translated = t(key);
      return translated !== key ? translated : type;
    },
    [t]
  );

  // ── Column definitions for DataTable (sortable) ───────────────────
  const ACTIVITY_COLUMNS: ColumnDef<ActivityType>[] = useMemo(
    () => [
      {
        accessorKey: "activity_type",
        header: t("activities.type"),
        cell: ({ getValue }) => {
          const type = getValue<ActivityType["activity_type"]>();
          const label = typeLabel(type);
          return (
            <Badge
              className={
                activityTypeStyles[type] ??
                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }
              variant="outline"
            >
              {label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "subject",
        header: t("activities.subject"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.subject}</span>
        ),
      },
      {
        accessorKey: "description",
        header: t("activities.descField"),
        cell: ({ getValue }) => {
          const desc = getValue<ActivityType["description"]>();
          return (
            <span className="text-muted-foreground max-w-[280px] truncate block">
              {desc ?? t("common.none")}
            </span>
          );
        },
      },
      {
        id: "contact",
        header: t("activities.contact"),
        cell: ({ row }) => {
          const contactId = row.original.contact_id;
          if (!contactId)
            return (
              <span className="text-muted-foreground">{t("common.none")}</span>
            );
          return (
            <span className="text-muted-foreground text-sm">
              <ContactNameCell contactId={contactId} />
            </span>
          );
        },
      },
      {
        id: "deal",
        header: t("activities.deal"),
        cell: ({ row }) => {
          const dealId = row.original.deal_id;
          if (!dealId)
            return (
              <span className="text-muted-foreground">{t("common.none")}</span>
            );
          return (
            <span className="text-muted-foreground text-sm">
              <DealNameCell dealId={dealId} />
            </span>
          );
        },
      },
      {
        accessorKey: "occurred_at",
        header: t("activities.date"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(getValue<ActivityType["occurred_at"]>(), locale)}
          </span>
        ),
      },
    ],
    [t, locale, typeLabel]
  );

  const emptyState = useMemo(
    () => (
      <EmptyState
        icon={Activity}
        title={t("activities.noActivities")}
        description={t("activities.noActivitiesDesc")}
        action={{
          label: t("activities.addActivity"),
          onClick: () => setFormOpen(true),
        }}
      />
    ),
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("activities.title")}
        description={
          data
            ? t("activities.description", { count: data.total })
            : t("activities.noDescription")
        }
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("activities.newActivity")}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          placeholder={t("activities.searchPlaceholder")}
          value={search}
          onChange={handleSearchChange}
          className="flex-1 max-w-md"
        />
        <Select
          value={activityTypeFilter}
          onValueChange={(value) => {
            setActivityTypeFilter(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("activities.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("activities.allTypes")}</SelectItem>
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {typeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            {t("contacts.loadError")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error
              ? error.message
              : t("contacts.loadErrorDetail")}
          </p>
        </div>
      )}

      {!isError && (
        <>
          <DataTable
            columns={ACTIVITY_COLUMNS}
            data={data?.items ?? []}
            isLoading={isLoading}
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

      <ActivityForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createActivity.isPending}
      />
    </div>
  );
}

/** Resolves and displays a contact name from a contact ID. */
function ContactNameCell({ contactId }: { contactId: string }) {
  const { t } = useTranslation();
  const { data: contact } = useContact(contactId);
  if (!contact)
    return <span className="text-muted-foreground/50">{t("common.none")}</span>;
  return (
    <>
      {contact.first_name} {contact.last_name}
    </>
  );
}

/** Resolves and displays a deal name from a deal ID. */
function DealNameCell({ dealId }: { dealId: string }) {
  const { t } = useTranslation();
  const { data: deal } = useDeal(dealId);
  if (!deal)
    return <span className="text-muted-foreground/50">{t("common.none")}</span>;
  return <>{deal.name}</>;
}
