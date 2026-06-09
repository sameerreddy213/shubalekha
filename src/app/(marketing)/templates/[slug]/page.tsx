import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTemplateBySlug, listTemplates } from "@/features/templates/services";
import type { SectionDef } from "@/types/invite";

export const revalidate = 300;

// ── Static params ──────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const templates = await listTemplates().catch(() => []);
  return templates.map((t) => ({ slug: t.slug }));
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tpl = await getTemplateBySlug(slug);
  if (!tpl) return { title: "Template not found" };
  return {
    title: tpl.name,
    description: tpl.description ?? undefined,
  };
}

// ── Section name map ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero / Cover",
  blessings: "Blessings & verse",
  invitationText: "Invitation text",
  welcomeMessage: "Welcome message",
  eventDetails: "Event details",
  timeline: "Schedule / Timeline",
  countdown: "Countdown timer",
  familyMembers: "Family members",
  venueMap: "Venue & map",
  thingsToKnow: "Good to know",
  ourStory: "Our story",
  gallery: "Photo gallery",
  wishes: "Wishes wall",
  rsvp: "RSVP",
  contactCards: "Contact cards",
  qrCode: "QR code",
  socialShare: "Social sharing",
  addToCalendar: "Add to calendar",
  music: "Background music",
  liveStream: "Live stream",
  gift: "Gift registry",
  closing: "Closing message",
};

const CATEGORY_LABELS: Record<string, string> = {
  hindu: "Hindu Wedding",
  "south-indian": "South Indian",
  muslim: "Muslim / Nikah",
  christian: "Christian",
  sikh: "Sikh",
  engagement: "Engagement",
  reception: "Reception",
  housewarming: "Housewarming",
  birthday: "Birthday",
  "baby-shower": "Baby Shower",
  anniversary: "Anniversary",
  naming: "Naming Ceremony",
  corporate: "Corporate",
  "save-the-date": "Save the Date",
  other: "Other",
};

// ── Page ───────────────────────────────────────────────────────────────────

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = await getTemplateBySlug(slug);
  if (!tpl) notFound();

  const sections = (tpl.sections ?? []) as unknown as SectionDef[];
  const enabledSections = sections.filter((s) => s.enabledByDefault);
  const optionalSections = sections.filter((s) => !s.enabledByDefault || s.optional);

  const categoryLabel = CATEGORY_LABELS[tpl.category as string] ?? tpl.category;

  return (
    <>
      <div className="container max-w-5xl py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/templates"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          All templates
        </Link>

        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
          {/* ── Left column: info ── */}
          <div>
            <span className="mb-3 inline-block rounded-full bg-muted px-3 py-1
                            text-xs font-medium text-muted-foreground">
              {categoryLabel}
            </span>

            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {tpl.name}
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground leading-relaxed">
              {tpl.description}
            </p>

            {/* Tags */}
            {(tpl.tags ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(tpl.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Colour variants */}
            {(tpl.variants as unknown[]).length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 text-sm font-semibold">Colour variants</h2>
                <div className="flex flex-wrap gap-3">
                  {(tpl.variants as Array<{
                    key: string;
                    name: string;
                    theme?: { palette?: { bg?: string; primary?: string; accent?: string } };
                  }>).map((v) => {
                    const p = v.theme?.palette;
                    return (
                      <div key={v.key} className="flex items-center gap-2.5">
                        <div className="flex overflow-hidden rounded-full border border-border/60">
                          {[p?.bg, p?.primary, p?.accent].map((c, i) => (
                            <span
                              key={i}
                              className="inline-block h-5 w-5"
                              style={{ backgroundColor: c ?? "#ccc" }}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{v.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Included sections */}
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold">
                Included sections ({enabledSections.length})
              </h2>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {enabledSections.map((s) => (
                  <div key={s.type} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="size-3.5 shrink-0 text-primary" />
                    {SECTION_LABELS[s.type] ?? s.type}
                  </div>
                ))}
              </div>
            </div>

            {/* Optional sections */}
            {optionalSections.length > 0 && (
              <div className="mt-5">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  Optional sections you can add ({optionalSections.length})
                </h2>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {optionalSections.map((s) => (
                    <div
                      key={s.type}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="size-3.5 shrink-0 rounded-full border border-border/80" />
                      {SECTION_LABELS[s.type] ?? s.type}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: sticky CTA card ── */}
          <div>
            <div className="sticky top-20 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="space-y-3">
                <p className="font-display text-lg font-semibold">Use this template</p>
                <p className="text-sm text-muted-foreground">
                  Sign in (or create a free account) to start customising this template
                  for your celebration.
                </p>

                <div className="space-y-1.5 pt-1">
                  {[
                    "All sections included",
                    "Multiple colour variants",
                    "Edit and publish in minutes",
                    "Free — always",
                  ].map((point) => (
                    <div key={point} className="flex items-center gap-2 text-sm">
                      <Check className="size-3.5 shrink-0 text-primary" />
                      {point}
                    </div>
                  ))}
                </div>

                <div className="pt-2 space-y-2">
                  <Button asChild className="w-full rounded-xl" size="lg">
                    <Link
                      href={`/login?template=${tpl.slug}`}
                    >
                      Get started — free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link href="/templates">Browse other templates</Link>
                  </Button>
                </div>

                <p className="pt-1 text-center text-xs text-muted-foreground">
                  No credit card. No trial period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
