"use client";

import { usePathname } from "next/navigation";

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

  // Match the closest known path
  const title =
    Object.entries(pageTitles).find(([key]) => pathname === key || (key !== "/" && pathname.startsWith(key)))?.[1] ??
    "CRM";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
