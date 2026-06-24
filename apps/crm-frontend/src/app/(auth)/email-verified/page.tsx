'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/shared/auth-layout';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/use-translation';
import * as authApi from '@/lib/api/auth';

function EmailVerifiedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Prevent double-invocation in Strict Mode
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    if (!token) {
      setStatus('error');
      setErrorMessage(t('auth.verifyEmailInvalidToken'));
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        await authApi.verifyEmail({ token });
        if (!cancelled) {
          setStatus('success');
        }
      } catch (err: any) {
        if (cancelled) return;
        const detail = err?.response?.data?.detail;
        setStatus('error');
        if (err?.response?.status === 400) {
          setErrorMessage(detail || t('auth.verifyEmailExpiredToken'));
        } else {
          setErrorMessage(t('auth.verifyEmailExpiredToken'));
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  if (status === 'loading') {
    return (
      <AuthLayout title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailSubtitle')}>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailSubtitle')}>
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          >
            {t('auth.verifyEmailSuccess')}
          </div>
          <Button className="w-full" onClick={() => router.push('/login')}>
            {t('auth.verifyEmailSignIn')}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  // Error state
  return (
    <AuthLayout title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailSubtitle')}>
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function EmailVerifiedPage() {
  const { t } = useTranslation();
  return (
    <Suspense
      fallback={
        <AuthLayout title={t('auth.verifyEmailTitle')} description={t('auth.verifyEmailSubtitle')}>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          </div>
        </AuthLayout>
      }
    >
      <EmailVerifiedContent />
    </Suspense>
  );
}
