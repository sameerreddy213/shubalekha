import { NextResponse, type NextRequest } from "next/server";
import { ROOT_DOMAIN } from "@/lib/env";
import { isReservedSlug } from "@/config/reserved-slugs";
import { securityHeaders } from "@/lib/security/headers";

/**
 * Edge middleware — host/subdomain routing + security headers.
 * (see docs/02-System-Architecture.md §3.1)
 *
 * IMPORTANT: edge-safe. No DB, no Auth.js, no Node-only imports. Route protection
 * for the dashboard/admin lives in their server layouts/guards (Node runtime).
 *
 * Routing:
 *   - root domain / www / app  → main app (marketing + dashboard + admin), pass through
 *   - reserved subdomain        → main app (can never be a published invite)
 *   - any other subdomain       → rewrite to /_sites/<slug>/... (the public invite)
 */
function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0]!.toLowerCase();
  if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) return null;
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.slice(0, -(ROOT_DOMAIN.length + 1));
  }
  // Unknown host (e.g. preview deploy, raw IP) → treat as main app.
  return null;
}

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders())) {
    res.headers.set(key, value);
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  // Main app (root / www / app / reserved) → no rewrite.
  if (!subdomain || subdomain === "www" || subdomain === "app" || isReservedSlug(subdomain)) {
    // /sites/* is an internal rewrite target — never reachable directly on the apex domain.
    if (pathname === "/sites" || pathname.startsWith("/sites/")) {
      return withSecurityHeaders(new NextResponse("Not found", { status: 404 }));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // On an invite subdomain, API + framework assets must not be rewritten.
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Published invite → rewrite to the internal /sites renderer.
  const url = req.nextUrl.clone();
  url.pathname = `/sites/${subdomain}${pathname === "/" ? "" : pathname}`;
  return withSecurityHeaders(NextResponse.rewrite(url));
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?)$).*)"],
};
