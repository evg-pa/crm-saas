"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  activitySchema,
  ACTIVITY_TYPES,
  type ActivityFormValues,
} from "@/lib/validators/activity";
import { useContacts } from "@/lib/hooks/use-contacts";
import { useDeals } from "@/lib/hooks/use-deals";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Activity } from "@/types";

const activityTypeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
  task: "Task",
  follow_up: "Follow-up",
};

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ActivityFormValues) => void;
  activity?: Activity | null;
  isSubmitting?: boolean;
}

export function ActivityForm({
  open,
  onOpenChange,
  onSubmit,
  activity,
  isSubmitting = false,
}: ActivityFormProps) {
  const isEditing = !!activity;

  const { data: contactsData } = useContacts({ limit: 100 });
  const { data: dealsData } = useDeals({ limit: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: activity
      ? {
          activity_type: activity.activity_type as ActivityFormValues["activity_type"],
          subject: activity.subject,
          description: activity.description,
          contact_id: activity.contact_id,
          deal_id: activity.deal_id,
          occurred_at: activity.occurred_at.split("T")[0],
        }
      : {
          activity_type: "call",
          subject: "",
          description: null,
          contact_id: null,
          deal_id: null,
          occurred_at: new Date().toISOString().slice(0, 16),
        },
  });

  const selectedContactId = watch("contact_id");
  const selectedDealId = watch("deal_id");

  const handleFormSubmit = (values: ActivityFormValues) => {
    onSubmit(values);
    if (!isEditing) reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Activity" : "New Activity"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the activity details below."
              : "Log a new activity for a contact or deal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="activity_type">Type *</Label>
            <Select
              value={watch("activity_type")}
              onValueChange={(v) =>
                setValue("activity_type", v as ActivityFormValues["activity_type"])
              }
            >
              <SelectTrigger id="activity_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {activityTypeLabels[type] ?? type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.activity_type && (
              <p className="text-sm text-destructive">
                {errors.activity_type.message}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Discovery call summary"
              {...register("subject")}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed notes about this activity..."
              rows={3}
              {...register("description", {
                setValueAs: (v: string) => (v === "" ? null : v),
              })}
            />
          </div>

          {/* Contact & Deal */}
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
                  <SelectValue placeholder="Select contact..." />
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
              <Label htmlFor="deal_id">Deal</Label>
              <Select
                value={selectedDealId ?? "none"}
                onValueChange={(v) =>
                  setValue("deal_id", v === "none" ? null : v)
                }
              >
                <SelectTrigger id="deal_id">
                  <SelectValue placeholder="Select deal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {dealsData?.items.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="occurred_at">Date *</Label>
            <Input
              id="occurred_at"
              type="datetime-local"
              {...register("occurred_at")}
            />
            {errors.occurred_at && (
              <p className="text-sm text-destructive">
                {errors.occurred_at.message}
              </p>
            )}
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
                  : "Create Activity"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
