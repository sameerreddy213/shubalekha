import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/invites", label: "Invitations" },
  { href: "/admin/templates", label: "Templates" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === "disabled") redirect("/login?disabled=1");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-xl font-semibold text-primary">
              {siteConfig.name}
              <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                Admin
              </span>
            </Link>
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-muted-foreground transition-colors
                             hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Back to app
            </Link>
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
