"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/stores/sidebar-store";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/contacts": "Contacts",
  "/companies": "Companies",
  "/deals": "Deals",
  "/activities": "Activities",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  // Match the closest known path
  const title =
    Object.entries(pageTitles).find(([key]) => pathname === key || (key !== "/" && pathname.startsWith(key)))?.[1] ??
    "CRM";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-2"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
