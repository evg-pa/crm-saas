"use client";

import { usePathname } from "next/navigation";
import { Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useTranslation } from "@/lib/i18n";
import { useLanguageStore, type Language } from "@/lib/stores/language-store";

const pageTitleKeys: Record<string, string> = {
  "/": "dashboard.title",
  "/contacts": "contacts.title",
  "/companies": "companies.title",
  "/deals": "deals.title",
  "/activities": "activities.title",
  "/settings": "settings.title",
};

export function Header() {
  const pathname = usePathname();
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  // Match the closest known path
  const titleKey =
    Object.entries(pageTitleKeys).find(
      ([key]) => pathname === key || (key !== "/" && pathname.startsWith(key))
    )?.[1] ?? "nav.dashboard";

  const title = t(titleKey);

  const languages: { value: Language; label: string }[] = [
    { value: "en", label: t("settings.english") },
    { value: "ru", label: t("settings.russian") },
  ];

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-2"
        onClick={() => setMobileOpen(true)}
        aria-label={t("common.close")}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold tracking-tight flex-1">{title}</h1>

      {/* Language Switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("settings.language")}>
            <Globe className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {languages.map(({ value, label }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setLanguage(value)}
              className={language === value ? "font-medium" : ""}
            >
              {label}
              {language === value && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
