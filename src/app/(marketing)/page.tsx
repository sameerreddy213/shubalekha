import Link from "next/link";
import { Sparkles, MousePointerClick, Share2, MapPin, Music, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, hsl(var(--accent)/0.18), transparent 70%), radial-gradient(50% 40% at 80% 20%, hsl(var(--primary)/0.12), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="container flex flex-col items-center py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-accent" /> Premium digital invitations — free
          </span>
          <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Create beautiful invitations <br className="hidden sm:block" /> guests never forget.
          </h1>
          <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Choose a stunning template, customise it in minutes, and share a live invitation website
            on your own link. Collect RSVPs, track views — all free.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/templates">Browse templates</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Choose · Customise · Share</p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-muted/20">
        <div className="container py-20">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
            Live in minutes
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <Step
              n={1}
              icon={<MousePointerClick className="size-5" />}
              title="Choose"
              body="Pick a template that matches your celebration — wedding, engagement, birthday and more."
            />
            <Step
              n={2}
              icon={<Sparkles className="size-5" />}
              title="Customise"
              body="Fill in your names, dates, venue and photos. It updates live as you type."
            />
            <Step
              n={3}
              icon={<Share2 className="size-5" />}
              title="Share"
              body="Publish to your own link and share on WhatsApp. Guests RSVP in two taps."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Everything your invitation needs
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<CalendarHeart className="size-5" />} title="RSVP & guest tracking" body="Collect responses, meal preferences and headcounts — with per-guest personalised links." />
          <Feature icon={<MapPin className="size-5" />} title="Maps & directions" body="Embedded venue maps and one-tap directions for every guest." />
          <Feature icon={<Music className="size-5" />} title="Background music" body="Set the mood with a tasteful soundtrack on your invitation." />
          <Feature icon={<Share2 className="size-5" />} title="Built for WhatsApp" body="Rich link previews with your names, date and photo — made to be shared." />
          <Feature icon={<Sparkles className="size-5" />} title="Luxury templates" body="Designed to feel premium, with elegant animations and typography." />
          <Feature icon={<MousePointerClick className="size-5" />} title="Edit anytime" body="Change details after publishing — updates instantly for everyone." />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center py-16 text-center">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Invite your guests in minutes.
          </h2>
          <p className="mt-3 text-primary-foreground/80">{siteConfig.tagline}</p>
          <Button asChild size="lg" variant="secondary" className="mt-7 rounded-full">
            <Link href="/templates">Get started — it&apos;s free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl font-medium">
        <span className="text-accent">{n}.</span> {title}
      </h3>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
