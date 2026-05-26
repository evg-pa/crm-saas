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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Contact } from "@/types";
import type { ContactFormValues } from "@/lib/validators/contact";

// ── Column definitions ──────────────────────────────────────────────────
// Static column defs use TanStack Table accessors so sorting works
// via DataTable's built-in click-to-sort header behaviour.
const CONTACT_COLUMNS: ColumnDef<Contact>[] = [
  {
    accessorFn: (row) => `${row.first_name} ${row.last_name}`,
    id: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.first_name} {row.original.last_name}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => {
      const email = getValue<Contact["email"]>();
      return <span className="text-muted-foreground">{email ?? "—"}</span>;
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ getValue }) => {
      const title = getValue<Contact["title"]>();
      return title ? <Badge variant="secondary">{title}</Badge> : "—";
    },
  },
  {
    id: "company",
    header: "Company",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        <CompanyNameCell companyId={row.original.company_id} />
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm">
        {formatDate(getValue<Contact["created_at"]>())}
      </span>
    ),
  },
];

export default function ContactsPage() {
  const router = useRouter();
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

  const handleCreate = (values: ContactFormValues) => {
    createContact.mutate(values, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleDelete = (contact: Contact) => {
    deleteContact.mutate(contact.id);
  };

  // SearchInput fires onChange after built-in 300 ms debounce.
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  // ── Empty state (shown inside DataTable when data.items is empty) ────
  const emptyState = useMemo(
    () => (
      <EmptyState
        icon={Users}
        title="No contacts yet"
        description="Create your first contact to get started."
        action={{
          label: "Add Contact",
          onClick: () => setFormOpen(true),
        }}
      />
    ),
    []
  );

  return (
    <div className="space-y-6">
      {/* Page Header — APP-19 §8.2.1 */}
      <PageHeader
        title="Contacts"
        description={
          data ? `${data.total} total contacts` : "Manage your contacts"
        }
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        }
      />

      {/* Search — APP-19 §8.2.7 (300 ms debounce built in) */}
      <SearchInput
        placeholder="Search contacts by name or email..."
        value={search}
        onChange={handleSearchChange}
        className="max-w-md"
      />

      {/* Error state — kept at page level */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            Failed to load contacts
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      )}

      {/* Data Table + Pagination — APP-19 §8.2.8 */}
      {!isError && (
        <>
          <DataTable
            columns={CONTACT_COLUMNS}
            data={data?.items ?? []}
            isLoading={isLoading}
            onRowClick={(contact) => router.push(`/contacts/${contact.id}`)}
            rowActions={[
              {
                label: "Edit",
                onClick: (contact) =>
                  router.push(`/contacts/${contact.id}`),
              },
              {
                label: "Delete",
                onClick: handleDelete,
                variant: "destructive",
              },
            ]}
            emptyState={emptyState}
          />

          {/* Pagination controls */}
          {data && data.total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {page * limit + 1}–
                {Math.min((page + 1) * limit, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Form Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createContact.isPending}
      />
    </div>
  );
}

