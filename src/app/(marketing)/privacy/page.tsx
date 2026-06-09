import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          {siteConfig.name} collects only what it needs to provide the service: your account email,
          the content you add to invitations, and privacy-respecting analytics. Visitor IP addresses
          are hashed for uniqueness counting and then discarded — we do not store precise location.
        </p>
        <p>This is a placeholder policy and will be finalised before public launch.</p>
      </div>
    </div>
  );
}
