'use client';

import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCurrentOrganization } from '@/lib/hooks/use-organizations';
import { useTranslation } from '@/lib/i18n';
import { useLanguageStore, type Language } from '@/lib/stores/language-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sun, Moon, Monitor, User, Building2, Hash, AlertTriangle, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { orgId, user } = useAuthStore();
  const { data: organization, isLoading: orgLoading, isError: orgError } = useCurrentOrganization();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  // Prevent hydration mismatch by only rendering theme UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { value: 'light', labelKey: 'settings.themeLight', icon: Sun },
    { value: 'dark', labelKey: 'settings.themeDark', icon: Moon },
    { value: 'system', labelKey: 'settings.themeSystem', icon: Monitor },
  ] as const;

  const languages: { value: Language; labelKey: string }[] = [
    { value: 'en', labelKey: 'settings.english' },
    { value: 'ru', labelKey: 'settings.russian' },
  ];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.description')}</p>
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
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('settings.description')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              {t('settings.organization')}
            </CardTitle>
            <CardDescription>{t('settings.organizationDesc')}</CardDescription>
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
                    {t('settings.orgLoadError')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {t('settings.orgLoadErrorDetail')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{organization?.name ?? 'CRM Organization'}</p>
                    <p className="text-xs text-muted-foreground">
                      {organization?.slug
                        ? `${t('settings.slug')}: ${organization.slug}`
                        : t('settings.activeAccount')}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t('settings.orgId')}
                      </p>
                      <p className="text-sm font-mono">{orgId ?? '—'}</p>
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
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>{t('settings.appearanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {themes.map(({ value, labelKey, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="flex-1"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {t(labelKey)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {theme === 'system'
                ? t('settings.themeSystemDesc')
                : theme === 'dark'
                  ? t('settings.themeDarkDesc')
                  : t('settings.themeLightDesc')}
            </p>
          </CardContent>
        </Card>

        {/* Language Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              {t('settings.language')}
            </CardTitle>
            <CardDescription>{t('settings.languageDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {languages.map(({ value, labelKey }) => (
                <Button
                  key={value}
                  variant={language === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLanguage(value)}
                  className="flex-1"
                >
                  {t(labelKey)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              {t('settings.profile')}
            </CardTitle>
            <CardDescription>{t('settings.profileDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">{t('settings.user')}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {user?.role ? t(`users.roles.${user.role}`) : t('settings.member')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('settings.activeSession')}
                  </span>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('settings.organization')}
                </p>
                <p className="text-sm mt-0.5">{organization?.name ?? 'CRM Organization'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('settings.orgId')}
                </p>
                <p className="text-sm font-mono mt-0.5">{orgId ?? '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
