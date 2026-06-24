'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Menu, Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useTranslation } from '@/lib/i18n';
import { useLanguageStore, type Language } from '@/lib/stores/language-store';

const pageTitleKeys: Record<string, string> = {
  '/': 'dashboard.title',
  '/contacts': 'contacts.title',
  '/companies': 'companies.title',
  '/deals': 'deals.title',
  '/activities': 'activities.title',
  '/settings': 'settings.title',
};

/** Derive initials from a name or email for the avatar fallback. */
function getInitials(user: { full_name?: string | null; email: string }): string {
  if (user.full_name) {
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return user.email[0].toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Match the closest known path
  const titleKey =
    Object.entries(pageTitleKeys).find(
      ([key]) => pathname === key || (key !== '/' && pathname.startsWith(key)),
    )?.[1] ?? 'nav.dashboard';

  const title = t(titleKey);

  const languages: { value: Language; label: string }[] = [
    { value: 'en', label: t('settings.english') },
    { value: 'ru', label: t('settings.russian') },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-2"
        onClick={() => setMobileOpen(true)}
        aria-label={t('common.close')}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold tracking-tight flex-1">{title}</h1>

      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('settings.language')}>
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map(({ value, label }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setLanguage(value)}
              className={language === value ? 'font-medium' : ''}
            >
              {label}
              {language === value && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.full_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
