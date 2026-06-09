import "server-only";
import { auth } from "./config";
import type { Session } from "next-auth";

/** The current session (or null). Server components / actions / route handlers. */
export async function currentSession(): Promise<Session | null> {
  return auth();
}

/** The current user (or null). */
export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}
