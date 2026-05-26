"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/lib/hooks/use-deals";
import { useContact } from "@/lib/hooks/use-contacts";
import { CompanyNameCell } from "@/components/shared/company-name-cell";
import { DealForm } from "@/features/deals/components/deal-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Handshake } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DEAL_STAGES } from "@/types";
import type { ColumnDef } from "@tanstack/react-table";
import type { Deal } from "@/types";
import type { DealFormValues } from "@/lib/validators/deal";
import { useTranslation } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  PageHeader,
  SearchInput,
  DataTable,
  EmptyState,
} from "@/components/shared";

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  discovery: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  proposal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const stageLabel = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function DealsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, currency } = useLocale();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const limit = 20;
  const { data, isLoading, isError, error } = useDeals({
    q: search || undefined,
    stage: stage !== "all" ? stage : undefined,
    offset: page * limit,
    limit,
  });

  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();

  const handleCreate = useCallback(
    (values: DealFormValues) => {
      createDeal.mutate(values, {
        onSuccess: (data) => {
          toast.success(
            t("deals.dealCreated", { name: data.name })
          );
          setFormOpen(false);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("deals.createError")
          ),
      });
    },
    [createDeal, t]
  );

  const handleDelete = useCallback(
    (deal: Deal) => {
      deleteDeal.mutate(deal.id, {
        onSuccess: () =>
          toast.success(
            t("deals.dealDeleted", { name: deal.name })
          ),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("deals.deleteError")
          ),
      });
    },
    [deleteDeal, t]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // ── Column definitions (sortable) ───────────────────────────────────
  const DEAL_COLUMNS: ColumnDef<Deal>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: t("deals.name"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "amount",
        header: t("deals.amount"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {formatCurrency(
              getValue<Deal["amount"]>(),
              locale,
              currency
            )}
          </span>
        ),
      },
      {
        accessorKey: "stage",
        header: t("deals.stage"),
        cell: ({ getValue }) => {
          const s = getValue<Deal["stage"]>();
          const stageKey = `dealStages.${s}` as const;
          return (
            <Badge className={stageColors[s] ?? ""} variant="outline">
              {t(stageKey) !== stageKey ? t(stageKey) : stageLabel(s)}
            </Badge>
          );
        },
      },
      {
        id: "contact",
        header: t("deals.contact"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            <ContactNameCell contactId={row.original.contact_id} />
          </span>
        ),
      },
      {
        id: "company",
        header: t("deals.company"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            <CompanyNameCell companyId={row.original.company_id} />
          </span>
        ),
      },
      {
        accessorKey: "expected_close_date",
        header: t("deals.closeDate"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(
              getValue<Deal["expected_close_date"]>(),
              locale
            )}
          </span>
        ),
      },
    ],
    [t, locale, currency]
  );

  const emptyState = useMemo(
    () => (
      <EmptyState
        icon={Handshake}
        title={t("deals.noDeals")}
        description={t("deals.noDealsDesc")}
        action={{
          label: t("deals.addDeal"),
          onClick: () => setFormOpen(true),
        }}
      />
    ),
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("deals.title")}
        description={
          data
            ? t("deals.description", { count: data.total })
            : t("deals.noDescription")
        }
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("deals.newDeal")}
          </Button>
        }
      />

      <div className="flex gap-4 items-center">
        <SearchInput
          placeholder={t("deals.searchPlaceholder")}
          value={search}
          onChange={handleSearchChange}
          className="flex-1 max-w-md"
        />
        <Select
          value={stage}
          onValueChange={(v) => {
            setStage(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("deals.allStages")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("deals.allStages")}</SelectItem>
            {DEAL_STAGES.map((s) => {
              const stageKey = `dealStages.${s}`;
              return (
                <SelectItem key={s} value={s}>
                  {t(stageKey) !== stageKey ? t(stageKey) : stageLabel(s)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            {t("deals.loadError")}
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
            columns={DEAL_COLUMNS}
            data={data?.items ?? []}
            isLoading={isLoading}
            onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
            rowActions={[
              {
                label: t("common.edit"),
                onClick: (deal) => router.push(`/deals/${deal.id}`),
              },
              {
                label: t("common.delete"),
                onClick: handleDelete,
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

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createDeal.isPending}
      />
    </div>
  );
}

/** Fetches and displays a contact name from a contact ID. */
function ContactNameCell({ contactId }: { contactId: string | null }) {
  const { t } = useTranslation();
  const { data: contact } = useContact(contactId ?? "");
  if (!contactId) return <>{t("common.none")}</>;
  if (!contact) return <span className="text-muted-foreground/50">…</span>;
  return (
    <>
      {contact.first_name} {contact.last_name}
    </>
  );
}
