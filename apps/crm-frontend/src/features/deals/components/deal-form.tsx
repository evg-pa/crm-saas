"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dealSchema, type DealFormValues } from "@/lib/validators/deal";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useCompanies } from "@/lib/hooks/use-companies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_STAGES } from "@/types";
import type { Deal } from "@/types";

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DealFormValues) => void;
  deal?: Deal | null;
  isSubmitting?: boolean;
}

export function DealForm({
  open,
  onOpenChange,
  onSubmit,
  deal,
  isSubmitting = false,
}: DealFormProps) {
  const isEditing = !!deal;
  const { data: contactsData } = useContacts({ limit: 200 });
  const { data: companiesData } = useCompanies({ limit: 200 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: deal
      ? {
          name: deal.name,
          amount: deal.amount,
          stage: deal.stage,
          contact_id: deal.contact_id,
          company_id: deal.company_id,
          expected_close_date: deal.expected_close_date
            ? deal.expected_close_date.split("T")[0]
            : null,
        }
      : {
          name: "",
          amount: null,
          stage: "new",
          contact_id: null,
          company_id: null,
          expected_close_date: null,
        },
  });

  const selectedContactId = watch("contact_id");
  const selectedCompanyId = watch("company_id");

  const handleFormSubmit = (values: DealFormValues) => {
    onSubmit(values);
    if (!isEditing) reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Deal" : "New Deal"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the deal's information below."
              : "Fill in the details to create a new deal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name *</Label>
            <Input
              id="name"
              placeholder="Enterprise license"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="10000"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={watch("stage")}
                onValueChange={(v) => setValue("stage", v)}
              >
                <SelectTrigger id="stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_id">Contact</Label>
              <Select
                value={selectedContactId ?? "none"}
                onValueChange={(v) =>
                  setValue("contact_id", v === "none" ? null : v)
                }
              >
                <SelectTrigger id="contact_id">
                  <SelectValue placeholder="Select a contact..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contactsData?.items.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              <Select
                value={selectedCompanyId ?? "none"}
                onValueChange={(v) =>
                  setValue("company_id", v === "none" ? null : v)
                }
              >
                <SelectTrigger id="company_id">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {companiesData?.items.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_close_date">Expected Close Date</Label>
            <Input
              id="expected_close_date"
              type="date"
              {...register("expected_close_date", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
