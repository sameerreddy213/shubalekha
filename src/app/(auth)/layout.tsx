import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-display text-2xl font-semibold tracking-tight text-primary"
      >
        {siteConfig.name}
      </Link>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-7 shadow-sm sm:p-8">
        {children}
      </div>
      <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}
