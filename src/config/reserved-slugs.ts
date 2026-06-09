/**
 * Reserved subdomains/slugs that users may never claim. Enforced in middleware
 * (routing) and again at slug validation/publish time (defense in depth).
 * Can be extended at runtime via Settings.reservedSlugs (admin).
 */
export const RESERVED_SLUGS = new Set<string>([
  // from the brief
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "templates",
  "support",
  "about",
  "contact",
  // infrastructure / safety additions
  "www",
  "app",
  "mail",
  "email",
  "smtp",
  "cdn",
  "static",
  "assets",
  "img",
  "images",
  "media",
  "files",
  "blog",
  "help",
  "docs",
  "status",
  "billing",
  "account",
  "settings",
  "auth",
  "verify",
  "og",
  "sitemap",
  "robots",
  "privacy",
  "terms",
  "refund",
  "pricing",
  "shubalekha",
  "test",
  "staging",
  "dev",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
