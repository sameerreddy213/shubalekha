import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/** URL-safe opaque random token (e.g. guest-link tokens, ids with no PII). */
export function opaqueToken(bytes = 12): string {
  return randomBytes(bytes).toString("base64url");
}

/** Stable, non-reversible hash (e.g. visitor uniqueness, ip fingerprint). */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const SIGNING_KEY = env.AUTH_SECRET || "dev-insecure-signing-key-change-me";

/**
 * Signed token: `<payload>.<hmac>` — tamper-evident, no DB lookup needed to trust
 * the payload. Used for the RSVP edit link (Phase 8).
 */
export function signToken(payload: string): string {
  const sig = createHmac("sha256", SIGNING_KEY).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = createHmac("sha256", SIGNING_KEY).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return payload;
}
