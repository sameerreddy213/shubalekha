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

/** Admin email + password sign-in. */
export async function credentialsSignInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email    = String(formData.get("email")    ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL_RE.test(email) || !password) {
    return { error: "Please enter your email and password." };
  }
  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (err: unknown) {
    const msg = (err as Error)?.message ?? "";
    // Next-auth throws a redirect error on success — let it propagate
    if (msg.includes("NEXT_REDIRECT")) throw err;
    return { error: "Invalid email or password." };
  }
  return { error: null };
}

/** Sign out and return to the marketing home. */
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
