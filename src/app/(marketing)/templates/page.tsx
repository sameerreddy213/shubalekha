import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Templates",
  description: "Browse premium invitation templates for weddings, birthdays and more.",
};

export default function TemplatesPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-3 text-muted-foreground">
          Our gallery of premium, schema-driven templates lands in Phase 9 — 20+ designs across
          Hindu, Muslim, Christian, Sikh and South-Indian weddings, plus birthdays, engagements and
          more.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/login">Sign in to start</Link>
        </Button>
      </div>
    </div>
  );
}
