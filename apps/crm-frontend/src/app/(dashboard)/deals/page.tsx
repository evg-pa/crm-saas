"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeals, useCreateDeal, useDeleteDeal } from "@/lib/hooks/use-deals";
import { useContact } from "@/lib/hooks/use-contacts";
import { CompanyNameCell } from "@/components/shared/company-name-cell";
import { DealForm } from "@/features/deals/components/deal-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { DEAL_STAGES } from "@/types";
import type { DealFormValues } from "@/lib/validators/deal";

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  discovery: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  proposal: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  negotiation: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  closed_won: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed_lost: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function DealsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 20;
  const { data, isLoading, isError, error } = useDeals({
    q: search || undefined,
    stage: stage !== "all" ? stage : undefined,
    offset: page * limit,
    limit,
  });

  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();

  const handleCreate = (values: DealFormValues) => {
    createDeal.mutate(values, {
      onSuccess: (data) => {
        toast.success(`Deal "${data.name}" created`);
        setFormOpen(false);
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to create deal"
        ),
    });
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteDeal.mutate(id, {
      onSuccess: () => toast.success("Deal deleted"),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to delete deal"
        ),
      onSettled: () => setDeletingId(null),
    });
  };

  const stageLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.total} total deals` : "Manage your deals and pipeline"}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deals by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={stage}
          onValueChange={(v) => {
            setStage(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {DEAL_STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {stageLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load deals</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No deals found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((deal) => (
                    <TableRow
                      key={deal.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      <TableCell className="font-medium">{deal.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatCurrency(deal.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={stageColors[deal.stage] ?? ""}
                          variant="outline"
                        >
                          {stageLabel(deal.stage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ContactNameCell contactId={deal.contact_id} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <CompanyNameCell companyId={deal.company_id} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(deal.expected_close_date)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/deals/${deal.id}`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(deal.id);
                              }}
                              disabled={deletingId === deal.id}
                            >
                              {deletingId === deal.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                              )}
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {page * limit + 1}–{Math.min((page + 1) * limit, data.total)} of{" "}
                {data.total}
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
  const { data: contact } = useContact(contactId ?? "");
  if (!contactId) return <>—</>;
  if (!contact) return <span className="text-muted-foreground/50">…</span>;
  return <>{contact.first_name} {contact.last_name}</>;
}

