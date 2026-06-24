'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/lib/stores/auth-store';
import * as authApi from '@/lib/api/auth';

const registerSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    full_name: z.string().optional(),
    organization_name: z
      .string()
      .min(1, 'Organization name is required')
      .max(255, 'Organization name must be at most 255 characters'),
    organization_slug: z
      .string()
      .min(1, 'Organization slug is required')
      .max(100, 'Slug must be at most 100 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  // Already logged in → redirect to dashboard
  if (token) {
    router.replace('/');
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      organization_name: '',
      organization_slug: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      const result = await authApi.register({
        email: values.email,
        password: values.password,
        full_name: values.full_name || undefined,
        organization_name: values.organization_name,
        organization_slug: values.organization_slug,
      });
      setAuth(result.access_token, result.organization_id, result.user);
      router.push('/');
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 409) {
        if (detail?.includes('email')) {
          setServerError('An account with this email already exists.');
        } else if (detail?.includes('slug')) {
          setServerError(
            'An organization with this slug already exists. Please choose a different one.',
          );
        } else {
          setServerError(detail || 'A user or organization with these details already exists.');
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <AuthLayout title="Create your workspace" description="Set up your account and organization">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Server error banner */}
        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            placeholder="Jane Smith"
            autoComplete="name"
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Organization Name */}
        <div className="space-y-2">
          <Label htmlFor="organization_name">Organization Name *</Label>
          <Input
            id="organization_name"
            placeholder="Acme Inc."
            {...register('organization_name')}
          />
          {errors.organization_name && (
            <p className="text-sm text-destructive">{errors.organization_name.message}</p>
          )}
        </div>

        {/* Organization Slug */}
        <div className="space-y-2">
          <Label htmlFor="organization_slug">Organization Slug *</Label>
          <Input id="organization_slug" placeholder="acme-inc" {...register('organization_slug')} />
          {errors.organization_slug && (
            <p className="text-sm text-destructive">{errors.organization_slug.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Used in URLs. Only lowercase letters, numbers, and hyphens.
          </p>
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
