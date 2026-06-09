import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Contact</h1>
      <p className="mt-4 text-muted-foreground">
        Questions, feedback or partnership ideas? Reach us at{" "}
        <a href={`mailto:${siteConfig.contactEmail}`} className="text-primary underline underline-offset-4">
          {siteConfig.contactEmail}
        </a>
        .
      </p>
    </div>
  );
}
