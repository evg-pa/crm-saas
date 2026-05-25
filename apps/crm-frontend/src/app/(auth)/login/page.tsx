import { AuthLayout } from "@/components/shared/auth-layout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="CRM Login"
      description="Authentication will be implemented in a future iteration."
    >
      <p className="text-center text-sm text-muted-foreground">
        Sign in form will be added when the auth backend is ready.
      </p>
    </AuthLayout>
  );
}
