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
import { useTranslation } from '@/lib/i18n/use-translation';
import * as authApi from '@/lib/api/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  // Already logged in → redirect to dashboard
  if (token) {
    router.replace('/');
    return null;
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setEmailNotVerified(false);
    setResendMessage(null);
    try {
      const result = await authApi.login(values);
      setAuth(result.access_token, result.organization_id, result.user);
      router.push('/');
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 401) {
        setServerError('Invalid email or password.');
      } else if (status === 403) {
        if (detail && detail.toLowerCase().includes('email not verified')) {
          setEmailNotVerified(true);
          setVerificationEmail(values.email);
        } else {
          setServerError('Account is inactive. Please contact support.');
        }
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage(null);
    try {
      await authApi.sendVerificationEmail({ email: verificationEmail });
      setResendMessage(t('auth.resendVerificationSuccess'));
    } catch {
      setResendMessage(t('auth.resendVerificationError'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to your workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email not verified banner */}
        {emailNotVerified && (
          <div className="space-y-3 rounded-md bg-amber-50 px-4 py-3 dark:bg-amber-950/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {t('auth.emailNotVerified')}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={resendLoading}
              onClick={handleResendVerification}
            >
              {resendLoading ? t('auth.resendVerificationLoading') : t('auth.resendVerification')}
            </Button>
            {resendMessage && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{resendMessage}</p>
            )}
          </div>
        )}

        {/* Server error banner */}
        {serverError && (
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {serverError}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Forgot password */}
        <p className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Forgot password?
          </Link>
        </p>
      </form>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
