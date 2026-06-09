import Link from "next/link";

/**
 * Public invitation renderer — placeholder.
 * Reached only via the subdomain rewrite in middleware (slug.<root> → /sites/<slug>).
 * Direct access to /sites/* on the apex domain is blocked by middleware.
 *
 * Phase 8 replaces this with the real ISR-cached, schema-driven invite page
 * (lifecycle states, sections, RSVP, OG, etc.).
 */
export default async function PublicInvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-3xl font-semibold text-primary">{slug}</p>
      <p className="mt-3 max-w-sm text-muted-foreground">
        This invitation isn&apos;t published yet. The public invitation experience is built in
        Phase 8.
      </p>
      <Link href="/" className="mt-6 text-sm text-primary underline underline-offset-4">
        Go to Shubalekha
      </Link>
    </main>
  );
}
