import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * App (dashboard/admin) shell. Authoritative auth gate runs here on the Node
 * runtime (middleware is edge-only and does no DB work). Disabled users are
 * bounced to login.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === "disabled") redirect("/login?disabled=1");

  const isAdmin = session.user.role === "admin";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-display text-xl font-semibold text-primary">
              {siteConfig.name}
            </Link>
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-muted">
                Dashboard
              </Link>
              <Link href="/templates" className="rounded-md px-3 py-2 hover:bg-muted">
                Templates
              </Link>
              {isAdmin && (
                <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-muted">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
}
