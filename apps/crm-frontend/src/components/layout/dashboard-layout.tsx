"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  Activity,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Deals", href: "/deals", icon: Handshake },
  { label: "Activities", href: "/activities", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

function MobileNav() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">CRM</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/**
 * AppShell (DashboardLayout) — master layout with sidebar + main content.
 *
 * Spec: APP-19 §8.2.2
 * Desktop (≥1024px): Sidebar fixed left, w-60, main area ml-60
 * Mobile (<1024px): Sidebar hidden, hamburger in Header opens Sheet overlay
 *
 * Lenses: Gestalt — Common Region (sidebar is visually distinct from content),
 *         Mobile Thumb Zones (nav in Sheet for mobile)
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar — hidden below lg, visible at lg+ */}
      <Sidebar />
      {/* Mobile nav sheet (radix dialog overlay) */}
      <MobileNav />
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-60">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
