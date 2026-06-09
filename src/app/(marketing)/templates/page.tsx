import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listTemplates } from "@/features/templates/services";
import { TemplateGallery } from "@/features/templates/components/template-gallery";
import { TEMPLATE_CATEGORIES } from "@/types/invite";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "22 premium invitation templates for Hindu, Muslim, Christian, Sikh and South Indian weddings, birthdays, engagements, and more.",
};

// ISR — revalidate when admin publishes / updates a template
export const revalidate = 300;

export default async function TemplatesPage() {
  // Fetch all published templates at build / ISR time
  const templates = await listTemplates().catch(() => []);

  // Collect which categories are actually present so the filter bar
  // only shows chips that have at least one template.
  const presentCategories = Array.from(
    new Set(templates.map((t) => t.category as string)),
  ).filter((c): c is string => TEMPLATE_CATEGORIES.includes(c as never));

  return (
    <>
      {/* ── Page hero ──────────────────────────────────────────────────── */}
      <section className="border-b bg-muted/30">
        <div className="container py-14 sm:py-20">
          {/* Left-aligned — anti-center-bias for DESIGN_VARIANCE 7 */}
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
              Templates
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {templates.length > 0 ? templates.length : "22"} templates
              <br />
              for every celebration.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Each template ships with a complete section schema, multiple colour variants,
              and the fields your guests actually need. Pick one, fill in your details,
              and publish in minutes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/login">Get started — free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="#gallery">Browse below</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Template gallery ──────────────────────────────────────────── */}
      <section id="gallery" className="container py-12 sm:py-16">
        {templates.length === 0 ? (
          <EmptyState />
        ) : (
          <TemplateGallery
            templates={templates}
            activeCategories={presentCategories}
          />
        )}
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center py-14 text-center">
          <h2 className="max-w-md font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to create your invitation?
          </h2>
          <p className="mt-2 text-sm text-primary-foreground/75">
            Sign in, pick a template, and you are live in minutes. Always free.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-6 rounded-full">
            <Link href="/login">Create your invitation</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

// ── Empty state (shown before seed runs) ──────────────────────────────────

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-xl font-medium text-muted-foreground">
        Templates are being prepared.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          npm run seed-templates
        </code>{" "}
        to populate the gallery.
      </p>
    </div>
  );
}
