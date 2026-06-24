'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companySchema, type CompanyFormValues } from '@/lib/validators/company';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Company } from '@/types';

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CompanyFormValues) => void;
  company?: Company | null;
  isSubmitting?: boolean;
}

export function CompanyForm({
  open,
  onOpenChange,
  onSubmit,
  company,
  isSubmitting = false,
}: CompanyFormProps) {
  const isEditing = !!company;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: company
      ? {
          name: company.name,
          website: company.website,
          industry: company.industry,
          size: company.size,
          address: company.address,
        }
      : {
          name: '',
          website: '',
          industry: '',
          size: null,
          address: '',
        },
  });

  const handleFormSubmit = (values: CompanyFormValues) => {
    onSubmit(values);
    if (!isEditing) reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Company' : 'New Company'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the company's information below."
              : 'Fill in the details to create a new company.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input id="name" placeholder="Acme Inc." {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://acme.com"
              {...register('website', {
                setValueAs: (v: string) => (v === '' ? null : v),
              })}
            />
            {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                placeholder="Technology"
                {...register('industry', {
                  setValueAs: (v: string) => (v === '' ? null : v),
                })}
              />
              {errors.industry && (
                <p className="text-sm text-destructive">{errors.industry.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Employees</Label>
              <Input
                id="size"
                type="number"
                min={0}
                placeholder="50"
                {...register('size', {
                  setValueAs: (v: string) => (v === '' ? null : parseInt(v, 10)),
                })}
              />
              {errors.size && <p className="text-sm text-destructive">{errors.size.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="123 Main St, San Francisco, CA"
              rows={2}
              {...register('address', {
                setValueAs: (v: string) => (v === '' ? null : v),
              })}
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
