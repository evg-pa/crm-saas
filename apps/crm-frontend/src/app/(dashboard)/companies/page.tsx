"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useCompanies,
  useCreateCompany,
  useDeleteCompany,
} from "@/lib/hooks/use-companies";
import { CompanyForm } from "@/features/companies/components/company-form";
import {
  PageHeader,
  SearchInput,
  DataTable,
  EmptyState,
} from "@/components/shared";
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
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { CompanyFormValues } from "@/lib/validators/company";
import type { Company } from "@/types";

export default function CompaniesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const limit = 20;
  const { data, isLoading, isError, error } = useCompanies({
    q: search || undefined,
    industry: industry !== "all" ? industry : undefined,
    offset: page * limit,
    limit,
  });

  // Extract unique industries from loaded items for the filter dropdown.
  const industries = useMemo(() => {
    const all = data?.items.map((c) => c.industry).filter(Boolean) as string[];
    return [...new Set(all)].sort();
  }, [data?.items]);

  const createCompany = useCreateCompany();
  const deleteCompany = useDeleteCompany();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleIndustryChange = useCallback((value: string) => {
    setIndustry(value);
    setPage(0);
  }, []);

  const handleCreate = useCallback(
    (values: CompanyFormValues) => {
      createCompany.mutate(values, {
        onSuccess: (data) => {
          toast.success(`Company "${data.name}" created`);
          setFormOpen(false);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to create company"
          ),
      });
    },
    [createCompany],
  );

  const handleDelete = useCallback(
    (company: Company) => {
      deleteCompany.mutate(company.id, {
        onSuccess: () => toast.success(`Company "${company.name}" deleted`),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to delete company"
          ),
      });
    },
    [deleteCompany],
  );

  // ── Column definitions for DataTable ────────────────────────────────
  const columns: ColumnDef<Company>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "industry",
        header: "Industry",
        cell: ({ row }) =>
          row.original.industry ? (
            <Badge variant="secondary">{row.original.industry}</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.size?.toLocaleString() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "website",
        header: "Website",
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            {row.original.website ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  const rowActions = useMemo(
    () => [
      {
        label: "Edit",
        onClick: (company: Company) =>
          router.push(`/companies/${company.id}`),
      },
      {
        label: "Delete",
        onClick: handleDelete,
        variant: "destructive" as const,
      },
    ],
    [router, handleDelete],
  );

  // ── State branches ──────────────────────────────────────────────────
  const isEmptyState =
    !isLoading && !isError && data && data.items.length === 0 && !search && industry === "all";

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Companies" },
        ]}
        title="Companies"
        description={
          data ? `${data.total} total companies` : "Manage your companies"
        }
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        }
      />

      {/* ── Search + Industry filter ─────────────────────────────────── */}
      <div className="flex gap-4 items-center">
        <SearchInput
          placeholder="Search companies by name or industry..."
          value={search}
          onChange={handleSearchChange}
          className="flex-1 max-w-md"
        />
        <Select value={industry} onValueChange={handleIndustryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Error state ──────────────────────────────────────────────── */}
      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Failed to load companies
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      )}

      {/* ── Empty state (no companies, no active filters) ────────────── */}
      {isEmptyState && (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Create your first company to start tracking relationships, deals, and contacts."
          action={{
            label: "Add Company",
            onClick: () => setFormOpen(true),
          }}
        />
      )}

      {/* ── Data table ───────────────────────────────────────────────── */}
      {!isError && !isEmptyState && (
        <>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            onRowClick={(company) => router.push(`/companies/${company.id}`)}
            rowActions={rowActions}
          />

          {/* ── Pagination ─────────────────────────────────────────── */}
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

      {/* ── Create form dialog ───────────────────────────────────────── */}
      <CompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createCompany.isPending}
      />
    </div>
  );
}
