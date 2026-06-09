import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          By using {siteConfig.name} you agree to use the service lawfully and not to publish
          content that is illegal, infringing or abusive. Invitations expire and slugs are released
          per our published lifecycle.
        </p>
        <p>These are placeholder terms and will be finalised before public launch.</p>
      </div>
    </div>
  );
}
