import "server-only";
import { timingSafeEqual } from "node:crypto";
import { auth } from "./config";
import { env } from "@/lib/env";
import type { Session } from "next-auth";

/** Canonical auth/authorization error codes (mirror docs/05-API-Contracts.md §4). */
export type AuthErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "DISABLED";

export class AuthError extends Error {
  code: AuthErrorCode;
  status: number;
  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
    this.status = code === "UNAUTHENTICATED" ? 401 : 403;
  }
}

/**
 * Require an authenticated, active user. Throws AuthError for route handlers to
 * map to a status code; server components should catch and redirect to /login.
 */
export async function requireUser(): Promise<NonNullable<Session["user"]>> {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (user.status === "disabled") throw new AuthError("DISABLED");
  return user;
}

/** Require a specific role (admin gating). */
export async function requireRole(role: "admin" | "user"): Promise<NonNullable<Session["user"]>> {
  const user = await requireUser();
  if (role === "admin" && user.role !== "admin") throw new AuthError("FORBIDDEN");
  return user;
}

/**
 * Verify the cron shared secret (constant-time). Accepts either
 * `Authorization: Bearer <secret>` or `x-cron-secret: <secret>`.
 */
export function requireCron(headers: Headers): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const provided =
    headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}
