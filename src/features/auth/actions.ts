"use server";

import { signIn, signOut } from "@/lib/auth/config";

export interface AuthActionState {
  error: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Start Google OAuth (redirects to Google, then back to /dashboard). */
export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}

/** Send a magic-link email, then redirect to the "check your email" page. */
export async function emailSignInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  // signIn throws a redirect on success — do not wrap in try/catch.
  await signIn("resend", { email, redirectTo: "/dashboard" });
  return { error: null };
}

/** Sign out and return to the marketing home. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
