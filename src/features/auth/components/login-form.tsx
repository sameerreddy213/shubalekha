"use client";

import { useActionState } from "react";
import { Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailSignInAction, googleSignInAction, type AuthActionState } from "@/features/auth/actions";

interface LoginFormProps {
  googleEnabled: boolean;
  emailEnabled: boolean;
  configured: boolean;
}

const initialState: AuthActionState = { error: null };

export function LoginForm({ googleEnabled, emailEnabled, configured }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(emailSignInAction, initialState);

  if (!configured) {
    return (
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
        <p className="font-medium">Authentication isn&apos;t configured yet.</p>
        <p className="mt-1 text-muted-foreground">
          Add <code className="font-mono">AUTH_GOOGLE_ID</code>/<code className="font-mono">AUTH_GOOGLE_SECRET</code>{" "}
          or <code className="font-mono">RESEND_API_KEY</code> to <code className="font-mono">.env.local</code> and
          restart. See <code className="font-mono">.env.example</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {googleEnabled && (
        <form action={googleSignInAction}>
          <Button type="submit" variant="outline" size="pill" className="w-full">
            <GoogleIcon /> Continue with Google
          </Button>
        </form>
      )}

      {googleEnabled && emailEnabled && (
        <div className="relative text-center">
          <span className="relative z-10 bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
            or
          </span>
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />
        </div>
      )}

      {emailEnabled && (
        <form action={formAction} className="space-y-3">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              aria-invalid={Boolean(state.error)}
              aria-describedby={state.error ? "email-error" : undefined}
            />
          </div>
          {state.error && (
            <p id="email-error" className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4" /> {state.error}
            </p>
          )}
          <Button type="submit" size="pill" className="w-full" disabled={pending}>
            <Mail /> {pending ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </form>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
