import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, googleEnabled, emailEnabled, authConfigured } from "@/lib/auth/config";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ disabled?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { disabled } = await searchParams;

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1.5">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to create and manage your invitations.
        </p>
      </div>

      {disabled && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          This account has been disabled. Contact support if you think this is a mistake.
        </div>
      )}

      <LoginForm googleEnabled={googleEnabled} emailEnabled={emailEnabled} configured={authConfigured} />
    </div>
  );
}
