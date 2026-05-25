"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActivities } from "@/lib/hooks/use-activities";
import { useContact } from "@/lib/hooks/use-contacts";
import { useDeal } from "@/lib/hooks/use-deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Distinct badge colors per activity type
const activityTypeStyles: Record<string, string> = {
  call: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  email: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  task: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  follow_up: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

// Readable label for each activity type
const activityTypeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
  task: "Task",
  follow_up: "Follow-up",
};

const ACTIVITY_TYPES = Object.keys(activityTypeLabels);

export default function ActivitiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState<string>("all");
  const [page, setPage] = useState(0);

  const limit = 20;
  const { data, isLoading, isError, error } = useActivities({
    q: search || undefined,
    activity_type: activityType !== "all" ? activityType : undefined,
    offset: page * limit,
    limit,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.total} total activities` : "Track your team's activity"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities by subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={activityType}
          onValueChange={(value) => {
            setActivityType(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {activityTypeLabels[type] ?? type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive font-medium">Failed to load activities</p>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No activities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Badge
                          className={
                            activityTypeStyles[activity.activity_type] ??
                            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }
                          variant="outline"
                        >
                          {activityTypeLabels[activity.activity_type] ?? activity.activity_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{activity.subject}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[280px] truncate">
                        {activity.description ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {activity.contact_id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/contacts/${activity.contact_id}`);
                            }}
                            className="text-primary hover:underline"
                          >
                            <ContactNameCell contactId={activity.contact_id} />
                          </button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {activity.deal_id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/deals/${activity.deal_id}`);
                            }}
                            className="text-primary hover:underline"
                          >
                            <DealNameCell dealId={activity.deal_id} />
                          </button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(activity.occurred_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
    </div>
  );
}

/** Resolves and displays a contact name from a contact ID. */
function ContactNameCell({ contactId }: { contactId: string }) {
  const { data: contact } = useContact(contactId);
  if (!contact) return <span className="text-muted-foreground/50">…</span>;
  return <>{contact.first_name} {contact.last_name}</>;
}

/** Resolves and displays a deal name from a deal ID. */
function DealNameCell({ dealId }: { dealId: string }) {
  const { data: deal } = useDeal(dealId);
  if (!deal) return <span className="text-muted-foreground/50">…</span>;
  return <>{deal.name}</>;
}
