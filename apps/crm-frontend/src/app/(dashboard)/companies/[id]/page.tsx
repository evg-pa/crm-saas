"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCompany, useUpdateCompany, useDeleteCompany } from "@/lib/hooks/use-companies";
import { CompanyForm } from "@/features/companies/components/company-form";
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
import { ArrowLeft, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { CompanyFormValues } from "@/lib/validators/company";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: company, isLoading, isError, error } = useCompany(id);
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
            <CardTitle className="text-base">Associated Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contacts list for this company will be displayed here.
            </p>
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
