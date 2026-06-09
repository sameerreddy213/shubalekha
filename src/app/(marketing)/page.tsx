"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MousePointerClick, Share2, MapPin, Music,
  CalendarHeart, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Animation presets ──────────────────────────────────────────────────────
const ease = [0.23, 1, 0.32, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

const stagger = (delay = 0) => ({
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease, delay } },
});

// ── Page ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
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
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              ✦ Premium digital invitations — always free
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-3xl font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Invitations that feel<br className="hidden sm:block" />
            <span className="text-accent"> as special</span> as your day.
          </motion.h1>

          <motion.p
            variants={stagger(0.15)}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-lg text-balance text-lg text-muted-foreground"
          >
            Choose a stunning template, personalise it in minutes, and share a
            live invitation your guests will actually remember.
          </motion.p>

          <motion.div
            variants={stagger(0.28)}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="group rounded-full px-7">
              <Link href="/templates">
                Browse templates
                <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link href="/login">Sign in free</Link>
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={stagger(0.38)}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground"
          >
            {["No credit card needed", "22 templates", "WhatsApp ready"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-accent" />
                {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/20">
        <div className="container py-20 sm:py-24">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center font-display text-3xl font-semibold tracking-tight"
          >
            Live in three steps
          </motion.h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { n: 1, icon: <MousePointerClick className="size-5" />, title: "Choose",    body: "Pick from 22 templates spanning Hindu, Muslim, Christian, Sikh, and South Indian celebrations." },
              { n: 2, icon: <MousePointerClick className="size-5" />, title: "Personalise", body: "Add your names, dates, venue, and photos. Every change shows instantly as you type." },
              { n: 3, icon: <Share2 className="size-5" />,            title: "Share",     body: "Publish to your own link and send on WhatsApp. Guests RSVP in seconds." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                variants={stagger(i * 0.1)}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="text-center"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {s.icon}
                </div>
                <h3 className="mt-4 font-display text-xl font-medium">
                  <span className="text-accent">{s.n}.</span> {s.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="container py-20 sm:py-24">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center font-display text-3xl font-semibold tracking-tight"
        >
          Everything included, nothing extra
        </motion.h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
          Every feature your invitation needs — at no cost, ever.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <CalendarHeart className="size-5" />, title: "RSVP & headcount",      body: "Collect responses, meal choices, and guest counts. See everyone who is attending in one place." },
            { icon: <MapPin className="size-5" />,        title: "Venue map & directions", body: "Embedded Google Maps and one-tap navigation so no guest gets lost." },
            { icon: <Music className="size-5" />,         title: "Background music",        body: "Set the mood with a song playing softly as guests open your invitation." },
            { icon: <Share2 className="size-5" />,        title: "Built for WhatsApp",      body: "Rich previews with your photo, names, and date — looks beautiful before guests even tap." },
            { icon: <MousePointerClick className="size-5" />, title: "Edit after publishing", body: "Changed the venue? Updated the time? Edits go live instantly for everyone." },
            { icon: <CheckCircle2 className="size-5" />,  title: "View analytics",          body: "See how many people opened your invitation and track RSVP trends over time." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              variants={stagger(i * 0.07)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                {f.icon}
              </div>
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Social proof strip ───────────────────────────────────────────── */}
      <section className="border-y bg-muted/30">
        <div className="container py-10">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { value: "22",    label: "Celebration templates" },
              { value: "Free",  label: "Forever, no hidden fees" },
              { value: "5 min", label: "From signup to live" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex flex-col"
              >
                <span className="font-display text-3xl font-semibold text-foreground">{s.value}</span>
                <span className="mt-1 text-sm text-muted-foreground">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center py-20 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Your guests deserve a beautiful invitation.
          </motion.h2>
          <motion.p
            variants={stagger(0.12)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="mt-3 max-w-sm text-primary-foreground/75"
          >
            Create yours in minutes — no design skills needed.
          </motion.p>
          <motion.div
            variants={stagger(0.22)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <Button asChild size="lg" variant="secondary" className="mt-7 rounded-full px-8">
              <Link href="/templates">Get started — it&apos;s free</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
