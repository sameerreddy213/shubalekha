"use client";

import { useActionState, useState } from "react";
import { Mail, AlertCircle, Lock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emailSignInAction, googleSignInAction, credentialsSignInAction,
  type AuthActionState,
} from "@/features/auth/actions";

interface LoginFormProps {
  googleEnabled: boolean;
  emailEnabled: boolean;
  configured: boolean;
}

const initialState: AuthActionState = { error: null };

export function LoginForm({ googleEnabled, emailEnabled, configured }: LoginFormProps) {
  const [emailState, emailAction, emailPending]       = useActionState(emailSignInAction, initialState);
  const [credsState, credsAction, credsPending]       = useActionState(credentialsSignInAction, initialState);
  const [adminOpen, setAdminOpen] = useState(false);

  if (!configured) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
        <p className="font-medium">Authentication isn&apos;t configured yet.</p>
        <p className="mt-1 text-muted-foreground">
          Add <code className="font-mono">AUTH_GOOGLE_ID</code> or{" "}
          <code className="font-mono">RESEND_API_KEY</code> to{" "}
          <code className="font-mono">.env</code> and restart.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Google */}
      {googleEnabled && (
        <form action={googleSignInAction}>
          <Button type="submit" variant="outline" size="pill" className="w-full">
            <GoogleIcon /> Continue with Google
          </Button>
        </form>
      )}

      {/* Divider */}
      {(googleEnabled && emailEnabled) && (
        <div className="relative text-center">
          <span className="relative z-10 bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">or</span>
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" aria-hidden />
        </div>
      )}

      {/* Magic link */}
      {emailEnabled && (
        <form action={emailAction} className="space-y-3">
          <div className="space-y-1.5 text-left">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              aria-invalid={Boolean(emailState.error)}
            />
          </div>
          {emailState.error && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="size-4" /> {emailState.error}
            </p>
          )}
          <Button type="submit" size="pill" className="w-full" disabled={emailPending}>
            <Mail /> {emailPending ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </form>
      )}

      {/* Admin sign-in (collapsed by default) */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setAdminOpen((o) => !o)}
          className="flex w-full items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5" /> Admin sign in
          </span>
          <ChevronDown className={`size-3.5 transition-transform ${adminOpen ? "rotate-180" : ""}`} />
        </button>

        {adminOpen && (
          <form action={credsAction} className="mt-3 space-y-3">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="admin-email">Admin email</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="admin@shubalekha.com"
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>
            {credsState.error && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="size-4" /> {credsState.error}
              </p>
            )}
            <Button type="submit" variant="secondary" size="pill" className="w-full" disabled={credsPending}>
              {credsPending ? "Signing in…" : "Sign in as admin"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
