import Link from "next/link";
import {
  MousePointerClick, Share2, MapPin, Music,
  CalendarHeart, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, AnimatedFeatureGrid, AnimatedStats } from "@/components/marketing/animated-sections";

// Server component — only the animated islands are client JS
export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: [
              "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--accent)/0.15), transparent 70%)",
              "radial-gradient(ellipse 50% 40% at 85% 25%, hsl(var(--primary)/0.10), transparent 70%)",
            ].join(", "),
          }}
        />

        <div className="container flex flex-col items-center py-24 text-center sm:py-32">
          <AnimatedSection delay={0}>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              ✦ Premium digital invitations — always free
            </span>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="mt-6 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Invitations that feel<br className="hidden sm:block" />
              <span className="text-accent"> as special</span> as your day.
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.22}>
            <p className="mt-5 max-w-lg text-balance text-lg text-muted-foreground">
              Choose a stunning template, personalise it in minutes, and share a
              live invitation your guests will actually remember.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.32}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="group rounded-full px-7">
                <Link href="/templates">
                  Browse templates
                  <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link href="/login">Sign in free</Link>
              </Button>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.42}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
              {["No credit card needed", "22 templates", "WhatsApp ready"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-accent" />
                  {t}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/20">
        <div className="container py-20 sm:py-24">
          <AnimatedSection>
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
              Live in three steps
            </h2>
          </AnimatedSection>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { n: 1, icon: <MousePointerClick className="size-5" />, title: "Choose",       body: "Pick from 22 templates spanning Hindu, Muslim, Christian, Sikh, and South Indian celebrations." },
              { n: 2, icon: <MousePointerClick className="size-5" />, title: "Personalise",  body: "Add your names, dates, venue, and photos. Every change shows instantly as you type." },
              { n: 3, icon: <Share2 className="size-5" />,            title: "Share",        body: "Publish to your own link and send on WhatsApp. Guests RSVP in seconds." },
            ].map((s, i) => (
              <AnimatedSection key={s.n} delay={i * 0.1}>
                <div className="text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {s.icon}
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium">
                    <span className="text-accent">{s.n}.</span> {s.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="container py-20 sm:py-24">
        <AnimatedSection>
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            Everything included, nothing extra
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
            Every feature your invitation needs — at no cost, ever.
          </p>
        </AnimatedSection>

        <AnimatedFeatureGrid
          features={[
            { icon: <CalendarHeart className="size-5" />, title: "RSVP & headcount",      body: "Collect responses, meal choices, and guest counts in one place." },
            { icon: <MapPin className="size-5" />,        title: "Venue map & directions", body: "Embedded Google Maps and one-tap navigation so no guest gets lost." },
            { icon: <Music className="size-5" />,         title: "Background music",        body: "Set the mood with a song that plays as guests open your invite." },
            { icon: <Share2 className="size-5" />,        title: "Built for WhatsApp",      body: "Rich previews with your photo, names, and date — beautiful before they even tap." },
            { icon: <MousePointerClick className="size-5" />, title: "Edit after publishing", body: "Changed the venue? Edits go live instantly for everyone." },
            { icon: <CheckCircle2 className="size-5" />,  title: "View analytics",          body: "See how many guests opened your invite and track RSVPs over time." },
          ]}
        />
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-10">
          <AnimatedStats
            stats={[
              { value: "22",    label: "Celebration templates" },
              { value: "Free",  label: "Forever, no hidden fees" },
              { value: "5 min", label: "From signup to live" },
            ]}
          />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center py-20 text-center">
          <AnimatedSection>
            <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Your guests deserve a beautiful invitation.
            </h2>
            <p className="mt-3 max-w-sm text-primary-foreground/75">
              Create yours in minutes — no design skills needed.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-7 rounded-full px-8">
              <Link href="/templates">Get started — it&apos;s free</Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
