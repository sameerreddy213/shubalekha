import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight text-primary">
            {siteConfig.name}
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link href="/templates" className="rounded-md px-3 py-2 hover:bg-muted">
              Templates
            </Link>
            <Link href="/#how" className="rounded-md px-3 py-2 hover:bg-muted">
              How it works
            </Link>
            <Link href="/about" className="rounded-md px-3 py-2 hover:bg-muted">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/templates">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>
            © {siteConfig.name}. {siteConfig.tagline}
          </p>
          <nav className="flex items-center gap-4">
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
