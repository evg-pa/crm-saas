"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useContact, useUpdateContact, useDeleteContact } from "@/lib/hooks/use-contacts";
import { useCompany } from "@/lib/hooks/use-companies";
import { ContactForm } from "@/features/contacts/components/contact-form";
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
import type { ContactFormValues } from "@/lib/validators/contact";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: contact, isLoading, isError, error } = useContact(id);
  const { data: company } = useCompany(contact?.company_id ?? "");

  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const handleUpdate = (values: ContactFormValues) => {
    updateContact.mutate(
      { id, ...values },
      { onSuccess: () => setFormOpen(false) }
    );
  };

  const handleDelete = () => {
    setDeleting(true);
    deleteContact.mutate(id, {
      onSuccess: () => router.push("/contacts"),
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
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !contact) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load contact</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Contact not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/contacts")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
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

      {/* Contact Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {contact.first_name} {contact.last_name}
        </h1>
        {contact.title && (
          <Badge variant="secondary" className="mt-1">
            {contact.title}
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Email" value={contact.email} />
            <DetailRow label="Phone" value={contact.phone} />
            <DetailRow label="Company" value={company?.name} />
            <DetailRow label="Created" value={formatDate(contact.created_at)} />
            <DetailRow label="Updated" value={formatDate(contact.updated_at)} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Activity placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent activity for this contact.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Form Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleUpdate}
        contact={contact}
        isSubmitting={updateContact.isPending}
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
