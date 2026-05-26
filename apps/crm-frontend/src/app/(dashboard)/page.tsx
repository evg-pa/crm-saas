"use client";

import { useContacts } from "@/lib/hooks/use-contacts";
import { useCompanies } from "@/lib/hooks/use-companies";
import { useDeals } from "@/lib/hooks/use-deals";
import { useActivities } from "@/lib/hooks/use-activities";
import { useTranslation } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Users,
  Building2,
  Handshake,
  Activity,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  // Fetch totals with minimal payload (limit: 1 just to get metadata)
  const { data: contactsData, isLoading: contactsLoading } = useContacts({ limit: 1 });
  const { data: companiesData, isLoading: companiesLoading } = useCompanies({ limit: 1 });
  const { data: dealsData, isLoading: dealsLoading } = useDeals({ limit: 1 });

  // Fetch 5 most recent activities
  const { data: activitiesData, isLoading: activitiesLoading } = useActivities({ limit: 5 });

  const kpis = [
    {
      label: t("dashboard.totalContacts"),
      value: contactsData?.total,
      icon: Users,
      loading: contactsLoading,
    },
    {
      label: t("dashboard.totalCompanies"),
      value: companiesData?.total,
      icon: Building2,
      loading: companiesLoading,
    },
    {
      label: t("dashboard.totalDeals"),
      value: dealsData?.total,
      icon: Handshake,
      loading: dealsLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.description")}
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
          title={t("nav.contacts")}
          description="Manage people and their details"
          href="/contacts"
          count={contactsData?.total}
          loading={contactsLoading}
        />
        <QuickLinkCard
          title={t("nav.companies")}
          description="Organizations you work with"
          href="/companies"
          count={companiesData?.total}
          loading={companiesLoading}
        />
        <QuickLinkCard
          title={t("nav.deals")}
          description="Track opportunities and pipeline"
          href="/deals"
          count={dealsData?.total}
          loading={dealsLoading}
        />
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t("dashboard.recentActivities")}
          </CardTitle>
          <Link
            href="/activities"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {t("common.viewAll")}
          </Link>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : activitiesData && activitiesData.items.length > 0 ? (
            <div className="space-y-1">
              {activitiesData.items.map((act, i) => (
                <div key={act.id}>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{act.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {act.activity_type} &middot; {formatDate(act.occurred_at, locale)}
                      </p>
                    </div>
                  </div>
                  {i < activitiesData.items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noRecentActivity")}
            </p>
          )}
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
