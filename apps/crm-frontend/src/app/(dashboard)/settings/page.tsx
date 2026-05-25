"use client";

import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCurrentOrganization } from "@/lib/hooks/use-organizations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Monitor, User, Building2, Hash, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { orgId } = useAuthStore();
  const { data: organization, isLoading: orgLoading, isError: orgError } =
    useCurrentOrganization();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your preferences and account.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your preferences and account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
            <CardDescription>Your organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orgLoading ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Separator />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : orgError ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive font-medium">
                    Failed to load organization
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  Organization data is currently unavailable.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {organization?.name ?? "CRM Organization"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {organization?.slug
                        ? `Slug: ${organization.slug}`
                        : "Active account"}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Organization ID
                      </p>
                      <p className="text-sm font-mono">{orgId ?? "—"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-4 w-4" />
              Appearance
            </CardTitle>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="flex-1"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {theme === "system"
                ? "Theme follows your system preference."
                : theme === "dark"
                  ? "Dark mode is active."
                  : "Light mode is active."}
            </p>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">CRM User</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Member
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Active session
                  </span>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Organization
                </p>
                <p className="text-sm mt-0.5">
                  {organization?.name ?? "CRM Organization"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Org ID
                </p>
                <p className="text-sm font-mono mt-0.5">{orgId ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
