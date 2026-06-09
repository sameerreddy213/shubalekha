import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTemplateBySlug, listTemplates } from "@/features/templates/services";
import type { SectionDef, ThemePalette } from "@/types/invite";

export const revalidate = 300;

export async function generateStaticParams() {
  const templates = await listTemplates().catch(() => []);
  return templates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tpl = await getTemplateBySlug(slug);
  if (!tpl) return { title: "Preview" };
  return { title: `Preview — ${tpl.name}` };
}

// ── Sample content injected per category ──────────────────────────────────
const DEMO: Record<string, Record<string, Record<string, string>>> = {
  wedding: {
    hero:      { brideName: "Meera", groomName: "Aarav", tagline: "Together with their families, they invite you to celebrate their union" },
    ceremony:  { date: "2025-12-12", time: "09:00", venue: "Sri Venkateswara Temple", address: "MG Road, Bangalore – 560001" },
    reception: { date: "2025-12-12", time: "19:00", venue: "The Leela Palace", address: "23 Airport Road, Bangalore – 560008" },
    rsvp:      { deadline: "2025-11-30" },
  },
  engagement: {
    hero:  { personOneName: "Priya", personTwoName: "Rohan", tagline: "A promise of forever" },
    event: { date: "2025-11-08", time: "18:00", venue: "The Grand Ballroom", address: "Taj West End, Bangalore" },
    rsvp:  { deadline: "2025-10-25" },
  },
  birthday: {
    hero:  { name: "Arjun", age: "30", tagline: "Three decades of awesome!" },
    party: { date: "2025-10-18", time: "20:00", venue: "Skybar Rooftop", address: "UB City, Bangalore" },
    rsvp:  { deadline: "2025-10-10" },
  },
  corporate: {
    hero:  { eventName: "Annual Product Launch", organiser: "Acme Corp", tagline: "Where innovation meets excellence" },
    event: { date: "2025-11-20", time: "10:00", venue: "The Ritz-Carlton", address: "Residency Road, Bangalore" },
    rsvp:  { deadline: "2025-11-15" },
  },
};

function demoContent(category: string) {
  if (["hindu","south-indian","muslim","christian","sikh","anniversary","housewarming","mehendi","sangeet"].includes(category))
    return DEMO.wedding!;
  if (["engagement","baby-shower"].includes(category)) return DEMO.engagement!;
  if (["birthday"].includes(category)) return DEMO.birthday!;
  if (["corporate"].includes(category)) return DEMO.corporate!;
  if (category === "save-the-date") return {
    hero:  { personOneName: "Isha", personTwoName: "Karan", tagline: "Mark your calendar" },
    event: { date: "2025-12-20", location: "Udaipur, Rajasthan" },
  };
  return DEMO.wedding!;
}

function get(content: Record<string, Record<string, string>>, sectionKey: string, fieldKey: string): string {
  return content[sectionKey]?.[fieldKey] ?? "";
}

function fmtTime(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h24 = parseInt(hStr ?? "0", 10);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${mStr ?? "00"} ${period}`;
}

function fmtDate(d: string): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  } catch { return d; }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tpl = await getTemplateBySlug(slug);
  if (!tpl) notFound();

  const variants = (tpl.variants ?? []) as Array<{
    key: string;
    name: string;
    theme?: { palette?: Partial<ThemePalette> };
  }>;
  const defaultVariant =
    variants.find((v) => v.key === tpl.defaultVariantKey) ?? variants.at(0);
  const rp = defaultVariant?.theme?.palette;
  const palette: ThemePalette = {
    bg:      rp?.bg      ?? "#ffffff",
    surface: rp?.surface ?? "#f5f5f5",
    primary: rp?.primary ?? "#1a1a1a",
    accent:  rp?.accent  ?? "#e07b00",
    text:    rp?.text    ?? "#0a0a0a",
    muted:   rp?.muted   ?? "#888888",
  };

  const sections = (tpl.sections ?? []) as unknown as SectionDef[];
  const content  = demoContent(tpl.category as string) as Record<string, Record<string, string>>;

  const heroSection   = sections.find((s) => s.type === "hero");
  const heroKey       = heroSection?.key ?? "hero";
  const brideName     = get(content, heroKey, "brideName")      || get(content, heroKey, "personOneName") || get(content, heroKey, "name");
  const groomName     = get(content, heroKey, "groomName")      || get(content, heroKey, "personTwoName") || "";
  const tagline       = get(content, heroKey, "tagline");
  const displayName   = groomName ? `${brideName} & ${groomName}` : brideName;

  const eventSections = sections.filter((s) => (s.type as string) === "event_details" || s.type === "eventDetails");
  const rsvpSection   = sections.find((s) => s.type === "rsvp");
  const rsvpKey       = rsvpSection?.key ?? "rsvp";
  const rsvpDeadline  = get(content, rsvpKey, "deadline");

  return (
    <div style={{ backgroundColor: palette.bg, minHeight: "100vh" }}>
      {/* Nav bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b px-5 py-3 backdrop-blur-sm"
           style={{ backgroundColor: palette.bg + "ee", borderColor: palette.muted + "30" }}>
        <Link
          href={`/templates/${tpl.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: palette.primary }}
        >
          <ArrowLeft className="size-4" /> Back to template details
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: palette.muted }}>Demo preview</span>
          <Link
            href={`/login?template=${tpl.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: palette.primary, color: palette.bg }}
          >
            Use this template <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Invitation body */}
      <div className="mx-auto max-w-lg px-6 py-12 text-center" style={{ color: palette.text }}>

        {/* Top ornament */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.35 }} />
          <span style={{ color: palette.accent, fontSize: 22 }}>✦</span>
          <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.35 }} />
        </div>

        {/* Category chip */}
        <span
          className="inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest mb-5"
          style={{ backgroundColor: palette.accent + "22", color: palette.accent }}
        >
          {tpl.name.split("—").at(0)?.trim() ?? tpl.name}
        </span>

        {/* Names */}
        <h1
          className="font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl"
          style={{ color: palette.primary }}
        >
          {displayName}
        </h1>

        {tagline && (
          <p className="mx-auto mt-4 max-w-sm text-base italic leading-relaxed" style={{ color: palette.muted }}>
            {tagline}
          </p>
        )}

        {/* Divider */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="h-px w-16" style={{ backgroundColor: palette.muted, opacity: 0.3 }} />
          <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: palette.muted }}>
            request the pleasure of your company
          </p>
          <div className="h-px w-16" style={{ backgroundColor: palette.muted, opacity: 0.3 }} />
        </div>

        {/* Event sections */}
        {eventSections.length > 0 && (
          <div className="space-y-4">
            {eventSections.map((s) => {
              const date  = get(content, s.key, "date");
              const time  = get(content, s.key, "time");
              const venue = get(content, s.key, "venue");
              const addr  = get(content, s.key, "address");

              return (
                <div
                  key={s.key}
                  className="rounded-2xl px-6 py-5 text-center"
                  style={{ backgroundColor: palette.surface }}
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-widest"
                     style={{ color: palette.accent }}>
                    {s.label ?? s.key}
                  </p>
                  {date  && <p className="text-lg font-semibold" style={{ color: palette.primary }}>{fmtDate(date)}</p>}
                  {time  && <p className="mt-0.5 text-sm" style={{ color: palette.muted }}>{fmtTime(time)}</p>}
                  {venue && <p className="mt-2 text-base font-medium" style={{ color: palette.text }}>{venue}</p>}
                  {addr  && <p className="mt-0.5 text-sm leading-snug" style={{ color: palette.muted }}>{addr}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* RSVP */}
        {rsvpSection && (
          <div className="mt-6 rounded-2xl px-6 py-4"
               style={{ backgroundColor: palette.primary + "12" }}>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: palette.primary }}>
              Kindly RSVP{rsvpDeadline ? ` by ${fmtDate(rsvpDeadline)}` : ""}
            </p>
          </div>
        )}

        {/* Bottom ornament */}
        <div className="mt-12 flex items-center justify-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.25 }} />
          <span style={{ color: palette.accent, fontSize: 16, opacity: 0.5 }}>✦</span>
          <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.25 }} />
        </div>

        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.25em]"
           style={{ color: palette.muted, opacity: 0.5 }}>
          shubalekha
        </p>

        {/* Variant strip */}
        {variants.length > 1 && (
          <div className="mt-10 border-t pt-8" style={{ borderColor: palette.muted + "20" }}>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: palette.muted }}>
              Available colour variants
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {variants.map((v) => {
                const p = v.theme?.palette;
                return (
                  <div key={v.key} className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded-full border" style={{ borderColor: palette.muted + "30" }}>
                      {[p?.bg, p?.primary, p?.accent].map((c, i) => (
                        <span key={i} className="inline-block h-5 w-5" style={{ backgroundColor: c ?? "#ccc" }} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: palette.muted }}>{v.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10">
          <Link
            href={`/login?template=${tpl.slug}`}
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ backgroundColor: palette.primary, color: palette.bg }}
          >
            Use this template — it&apos;s free
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-3 text-xs" style={{ color: palette.muted }}>
            No credit card. Customise in minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
