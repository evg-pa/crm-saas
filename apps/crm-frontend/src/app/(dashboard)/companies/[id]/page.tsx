"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompany, useUpdateCompany, useDeleteCompany } from "@/lib/hooks/use-companies";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useDeals } from "@/lib/hooks/use-deals";
import { CompanyForm } from "@/features/companies/components/company-form";
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
import type { CompanyFormValues } from "@/lib/validators/company";

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

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: company, isLoading, isError, error } = useCompany(id);
  const { data: contactsData, isLoading: contactsLoading } = useContacts({
    company_id: id,
    limit: 100,
  });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({
    company_id: id,
    limit: 100,
  });
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const handleUpdate = (values: CompanyFormValues) => {
    updateCompany.mutate(
      { id, ...values },
      { onSuccess: () => setFormOpen(false) }
    );
  };

  const handleDelete = () => {
    setDeleting(true);
    deleteCompany.mutate(id, {
      onSuccess: () => router.push("/companies"),
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

  if (isError || !company) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/companies")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load company</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Company not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/companies")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
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
        <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
        {company.industry && (
          <Badge variant="secondary" className="mt-1">
            {company.industry}
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Website" value={company.website} />
            <DetailRow label="Industry" value={company.industry} />
            <DetailRow label="Employees" value={company.size?.toLocaleString()} />
            <DetailRow label="Address" value={company.address} />
            <DetailRow label="Created" value={formatDate(company.created_at)} />
            <DetailRow label="Updated" value={formatDate(company.updated_at)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {contactsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : contactsData && contactsData.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Title</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsData.items.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <TableCell className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {contact.title ? (
                          <Badge variant="secondary">{contact.title}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No contacts associated with this company.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : dealsData && dealsData.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dealsData.items.map((deal) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No deals associated with this company.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <CompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleUpdate}
        company={company}
        isSubmitting={updateCompany.isPending}
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
