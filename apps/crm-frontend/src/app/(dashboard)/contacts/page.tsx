"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useContacts, useCreateContact, useDeleteContact } from "@/lib/hooks/use-contacts";
import { CompanyNameCell } from "@/components/shared/company-name-cell";
import { ContactForm } from "@/features/contacts/components/contact-form";
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
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { Contact } from "@/types";
import type { ContactFormValues } from "@/lib/validators/contact";

export default function ContactsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const limit = 20;
  const { data, isLoading, isError, error } = useContacts({
    q: search || undefined,
    offset: page * limit,
    limit,
  });

  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const handleCreate = useCallback(
    (values: ContactFormValues) => {
      createContact.mutate(values, {
        onSuccess: (data) => {
          toast.success(
            t("contacts.contactCreated", {
              name: `${data.first_name} ${data.last_name}`,
            })
          );
          setFormOpen(false);
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : t("contacts.createError")
          );
        },
      });
    },
    [createContact, t]
  );

  const handleDelete = useCallback(
    (contact: Contact) => {
      deleteContact.mutate(contact.id, {
        onSuccess: () =>
          toast.success(
            t("contacts.contactDeleted", {
              name: `${contact.first_name} ${contact.last_name}`,
            })
          ),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : t("contacts.deleteError")
          ),
      });
    },
    [deleteContact, t]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // ── Column definitions (sortable) ────────────────────────────────────
  const CONTACT_COLUMNS: ColumnDef<Contact>[] = useMemo(
    () => [
      {
        accessorFn: (row) => `${row.first_name} ${row.last_name}`,
        id: "name",
        header: t("contacts.name"),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.first_name} {row.original.last_name}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: t("contacts.email"),
        cell: ({ getValue }) => {
          const email = getValue<Contact["email"]>();
          return (
            <span className="text-muted-foreground">{email ?? t("common.none")}</span>
          );
        },
      },
      {
        accessorKey: "title",
        header: t("contacts.title_field"),
        cell: ({ getValue }) => {
          const title = getValue<Contact["title"]>();
          return title ? (
            <Badge variant="secondary">{title}</Badge>
          ) : (
            t("common.none")
          );
        },
      },
      {
        id: "company",
        header: t("contacts.company"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            <CompanyNameCell companyId={row.original.company_id} />
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: t("contacts.created"),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(getValue<Contact["created_at"]>(), locale)}
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
        title={t("contacts.noContacts")}
        description={t("contacts.noContactsDesc")}
        action={{
          label: t("contacts.addContact"),
          onClick: () => setFormOpen(true),
        }}
      />
    ),
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("contacts.title")}
        description={
          data
            ? t("contacts.description", { count: data.total })
            : t("contacts.noDescription")
        }
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("contacts.addContact")}
          </Button>
        }
      />

      <SearchInput
        placeholder={t("contacts.searchPlaceholder")}
        value={search}
        onChange={handleSearchChange}
        className="max-w-md"
      />

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
            columns={CONTACT_COLUMNS}
            data={data?.items ?? []}
            isLoading={isLoading}
            onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
            rowActions={[
              {
                label: t("common.edit"),
                onClick: (contact) =>
                  router.push(`/contacts/${contact.id}`),
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

      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createContact.isPending}
      />
    </div>
  );
}
