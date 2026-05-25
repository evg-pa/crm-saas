"use client";

import { useContacts } from "@/lib/hooks/use-contacts";
import { useCompanies } from "@/lib/hooks/use-companies";
import { useDeals } from "@/lib/hooks/use-deals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Handshake,
} from "lucide-react";

export default function DashboardPage() {
  // Fetch totals with minimal payload (limit: 1 just to get metadata)
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ limit: 1 });
  const { data: companiesData, isLoading: companiesLoading } = useCompanies({ limit: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 1 });

  // Use metadata directly — these are counts from the server
  const dealsTotal = dealsData?.total;

  const kpis = [
    {
      label: "Total Contacts",
      value: contactsData?.total,
      icon: Users,
      loading: contactsLoading,
    },
    {
      label: "Total Companies",
      value: companiesData?.total,
      icon: Building2,
      loading: companiesLoading,
    },
    {
      label: "Total Deals",
      value: dealsTotal,
      icon: Handshake,
      loading: dealsLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your CRM at a glance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {kpi.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {kpi.value != null ? kpi.value.toLocaleString() : "—"}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickLinkCard
          title="Contacts"
          description="Manage people and their details"
          href="/contacts"
          count={contactsData?.total}
          loading={contactsLoading}
        />
        <QuickLinkCard
          title="Companies"
          description="Organizations you work with"
          href="/companies"
          count={companiesData?.total}
          loading={companiesLoading}
        />
        <QuickLinkCard
          title="Deals"
          description="Track opportunities and pipeline"
          href="/deals"
          count={dealsData?.total}
          loading={dealsLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Recent activity feed will be displayed here once activities are recorded.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
  count,
  loading,
}: {
  title: string;
  description: string;
  href: string;
  count?: number;
  loading: boolean;
}) {
  return (
    <a href={href} className="block group">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            {loading ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <Badge variant="secondary">{count ?? 0}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </a>
  );
}
