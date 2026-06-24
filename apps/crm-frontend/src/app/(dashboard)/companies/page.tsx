'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCompanies, useCreateCompany, useDeleteCompany } from '@/lib/hooks/use-companies';
import { CompanyForm } from '@/features/companies/components/company-form';
import { PageHeader, SearchInput, DataTable, EmptyState } from '@/components/shared';
import { useTranslation } from '@/lib/i18n';
import { useLocale } from '@/lib/i18n/use-locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { CompanyFormValues } from '@/lib/validators/company';
import type { Company } from '@/types';

export default function CompaniesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  const limit = 20;
  const { data, isLoading, isError, error } = useCompanies({
    q: search || undefined,
    industry: industry !== 'all' ? industry : undefined,
    offset: page * limit,
    limit,
  });

  // Extract unique industries from loaded items for the filter dropdown.
  const industries = useMemo(() => {
    const all = data?.items.map((c) => c.industry).filter(Boolean) as string[];
    return [...new Set(all)].sort();
  }, [data?.items]);

  const createCompany = useCreateCompany();
  const deleteCompany = useDeleteCompany();

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const handleIndustryChange = useCallback((value: string) => {
    setIndustry(value);
    setPage(0);
  }, []);

  const handleCreate = useCallback(
    (values: CompanyFormValues) => {
      createCompany.mutate(values, {
        onSuccess: (data) => {
          toast.success(t('companies.companyCreated', { name: data.name }));
          setFormOpen(false);
        },
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : t('companies.createError')),
      });
    },
    [createCompany, t],
  );

  const handleDelete = useCallback(
    (company: Company) => {
      deleteCompany.mutate(company.id, {
        onSuccess: () => toast.success(t('companies.companyDeleted', { name: company.name })),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : t('companies.deleteError')),
      });
    },
    [deleteCompany, t],
  );

  // ── Column definitions for DataTable ────────────────────────────────
  const columns: ColumnDef<Company>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('companies.name'),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'industry',
        header: t('companies.industry'),
        cell: ({ row }) =>
          row.original.industry ? (
            <Badge variant="secondary">{row.original.industry}</Badge>
          ) : (
            <span className="text-muted-foreground">{t('common.none')}</span>
          ),
      },
      {
        accessorKey: 'size',
        header: t('companies.size'),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.size?.toLocaleString() ?? t('common.none')}
          </span>
        ),
      },
      {
        accessorKey: 'website',
        header: t('companies.website'),
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate text-muted-foreground">
            {row.original.website ?? t('common.none')}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: t('companies.created'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at, locale)}
          </span>
        ),
      },
    ],
    [t, locale],
  );

  const rowActions = useMemo(
    () => [
      {
        label: t('common.edit'),
        onClick: (company: Company) => router.push(`/companies/${company.id}`),
      },
      {
        label: t('common.delete'),
        onClick: handleDelete,
        variant: 'destructive' as const,
      },
    ],
    [router, handleDelete, t],
  );

  // ── State branches ──────────────────────────────────────────────────
  const isEmptyState =
    !isLoading && !isError && data && data.items.length === 0 && !search && industry === 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/' }, { label: t('companies.title') }]}
        title={t('companies.title')}
        description={
          data ? t('companies.description', { count: data.total }) : t('companies.noDescription')
        }
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('companies.newCompany')}
          </Button>
        }
      />

      <div className="flex gap-4 items-center">
        <SearchInput
          placeholder={t('companies.searchPlaceholder')}
          value={search}
          onChange={handleSearchChange}
          className="flex-1 max-w-md"
        />
        <Select value={industry} onValueChange={handleIndustryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('companies.allIndustries')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('companies.allIndustries')}</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind} value={ind}>
                {ind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{t('companies.loadError')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : t('contacts.loadErrorDetail')}
          </p>
        </div>
      )}

      {isEmptyState && (
        <EmptyState
          icon={Building2}
          title={t('companies.noCompanies')}
          description={t('companies.noCompaniesDesc')}
          action={{
            label: t('companies.addCompany'),
            onClick: () => setFormOpen(true),
          }}
        />
      )}

      {!isError && !isEmptyState && (
        <>
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            onRowClick={(company) => router.push(`/companies/${company.id}`)}
            rowActions={rowActions}
          />

          {data && data.total > limit && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('common.showing')} {page * limit + 1}–{Math.min((page + 1) * limit, data.total)}{' '}
                {t('common.of')} {data.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(page + 1) * limit >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <CompanyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createCompany.isPending}
      />
    </div>
  );
}
