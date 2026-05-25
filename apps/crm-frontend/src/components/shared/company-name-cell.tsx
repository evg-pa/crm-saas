"use client";

import { useCompany } from "@/lib/hooks/use-companies";

/** Fetches and displays a company name from a company ID. */
export function CompanyNameCell({ companyId }: { companyId: string | null }) {
  const { data: company } = useCompany(companyId ?? "");
  if (!companyId) return <>—</>;
  if (!company) return <span className="text-muted-foreground/50">…</span>;
  return <>{company.name}</>;
}
