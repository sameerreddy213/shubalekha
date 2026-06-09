import { isProd } from "@/lib/env";

/**
 * Security headers applied in middleware to every response.
 * CSP is intentionally pragmatic for Next.js (allows inline styles + the small
 * amount of inline script Next emits). Tighten with nonces in a later hardening pass.
 */
export function securityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-DNS-Prefetch-Control": "on",
  };

  if (isProd) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}
