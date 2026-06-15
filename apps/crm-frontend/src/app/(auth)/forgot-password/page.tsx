"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/shared/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as authApi from "@/lib/api/auth";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(values);
      setSuccess(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        description="If an account exists, you'll receive a reset link"
      >
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          >
            If the email exists, a password reset link has been emailed.
          </div>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
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

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
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
