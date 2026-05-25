"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeal, useUpdateDeal, useDeleteDeal } from "@/lib/hooks/use-deals";
import { useContact } from "@/lib/hooks/use-contacts";
import { useCompany } from "@/lib/hooks/use-companies";
import { useActivities } from "@/lib/hooks/use-activities";
import { DealForm } from "@/features/deals/components/deal-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { DealFormValues } from "@/lib/validators/deal";

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

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: deal, isLoading, isError, error } = useDeal(id);
  const { data: contact } = useContact(deal?.contact_id ?? "");
  const { data: company } = useCompany(deal?.company_id ?? "");
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({
    deal_id: id,
    limit: 50,
  });
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const handleUpdate = (values: DealFormValues) => {
    updateDeal.mutate(
      { id, ...values },
      { onSuccess: () => setFormOpen(false) }
    );
  };

  const handleDelete = () => {
    setDeleting(true);
    deleteDeal.mutate(id, {
      onSuccess: () => router.push("/deals"),
      onSettled: () => setDeleting(false),
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/deals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deals
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load deal</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Deal not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/deals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Deals
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{deal.name}</h1>
        <Badge className={`mt-1 ${stageColors[deal.stage] ?? ""}`} variant="outline">
          {stageLabel(deal.stage)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Amount" value={formatCurrency(deal.amount)} />
            <DetailRow label="Stage" value={stageLabel(deal.stage)} />
            <DetailRow
              label="Expected Close"
              value={formatDate(deal.expected_close_date)}
            />
            <DetailRow
              label="Contact"
              value={
                deal.contact_id
                  ? contact
                    ? `${contact.first_name} ${contact.last_name}`
                    : "—"
                  : null
              }
            />
            <DetailRow
              label="Company"
              value={
                deal.company_id
                  ? company
                    ? company.name
                    : "—"
                  : null
              }
            />
            <DetailRow label="Created" value={formatDate(deal.created_at)} />
            <DetailRow label="Updated" value={formatDate(deal.updated_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : activitiesData && activitiesData.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activitiesData.items.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">
                        {activity.subject}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activity.activity_type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(activity.occurred_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No activities recorded for this deal.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleUpdate}
        deal={deal}
        isSubmitting={updateDeal.isPending}
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
