'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  Activity,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/stores/sidebar-store';
import { useTranslation } from '@/lib/i18n';
import { useHasRole } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';

interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const { t } = useTranslation();

  const isAdmin = useHasRole('admin');

  const navItems: NavItem[] = [
    { labelKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
    { labelKey: 'nav.contacts', href: '/contacts', icon: Users },
    { labelKey: 'nav.companies', href: '/companies', icon: Building2 },
    { labelKey: 'nav.deals', href: '/deals', icon: Handshake },
    { labelKey: 'nav.activities', href: '/activities', icon: Activity },
    // Users page is admin-only
    ...(isAdmin ? [{ labelKey: 'nav.users' as const, href: '/users', icon: UserCog }] : []),
    { labelKey: 'nav.settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'hidden lg:flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Building2 className="h-4 w-4" />
        </div>
        {!isCollapsed && <span className="font-semibold tracking-tight">CRM</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
              title={isCollapsed ? t(item.labelKey) : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={toggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
