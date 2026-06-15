"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/shared/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authApi from "@/lib/api/auth";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Missing token
  if (!token) {
    return (
      <AuthLayout
        title="Reset your password"
        description="Enter a new password for your account"
      >
        <div className="space-y-4">
          <div
            role="alert"
            className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Invalid or missing reset token. Please request a new password reset
            link.
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        token,
        new_password: values.newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 400) {
        setServerError(
          detail || "Invalid or expired reset token. Please request a new one."
        );
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Password reset"
        description="Your password has been updated"
      >
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          >
            Your password has been reset successfully.
          </div>
          <Button
            className="w-full"
            onClick={() => router.push("/login")}
          >
            Sign in with new password
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter a new password for your account"
    >
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

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout
          title="Reset your password"
          description="Loading..."
        >
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </AuthLayout>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
