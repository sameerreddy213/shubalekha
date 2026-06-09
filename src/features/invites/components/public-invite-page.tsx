"use client";
import { useEffect, useState } from "react";
import { Calendar, MapPin, Music, Wifi, Gift, BookOpen, Users, Clock } from "lucide-react";
import { RsvpForm } from "@/features/rsvp/components/rsvp-form";
import type { InviteDoc, TemplateDoc } from "@/models";
import type { SectionDef, SectionType } from "@/types/invite";

interface PublicInvitePageProps {
  inviteId: string;
  invite: InviteDoc & { _id: { toString(): string } };
  template: TemplateDoc & { sections: SectionDef[] };
  guestLinkToken?: string;
}

type ContentMap = Record<string, Record<string, unknown>>;

export function PublicInvitePage({ inviteId, invite, template, guestLinkToken }: PublicInvitePageProps) {
  const content = (invite.content ?? {}) as ContentMap;
  const sections = (template.sections ?? []) as unknown as SectionDef[];

  // Per-guest personalisation: resolve guest name from token client-side
  const [guestName, setGuestName] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!guestLinkToken) return;
    fetch(`/api/guestlinks/resolve?token=${encodeURIComponent(guestLinkToken)}`)
      .then((r) => r.json() as Promise<{ data?: { guestName?: string } }>)
      .then((j) => { if (j.data?.guestName) setGuestName(j.data.guestName); })
      .catch(() => undefined);
    // Fire analytics beacon
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId, guestLinkToken }),
    }).catch(() => undefined);
  }, [inviteId, guestLinkToken]);

  // Fire beacon even without a guest token
  useEffect(() => {
    if (guestLinkToken) return;
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteId }),
    }).catch(() => undefined);
  }, [inviteId, guestLinkToken]);

  // Build the ordered, enabled section list
  const sectionOverrides = (invite.sectionOverrides ?? []) as { type: string; enabled: boolean; order: number }[];
  const overrideMap = Object.fromEntries(sectionOverrides.map((o) => [o.type, o]));

  const enabledSections = sections
    .filter((s) => overrideMap[s.type]?.enabled ?? s.enabledByDefault)
    .sort((a, b) => {
      const orderA = overrideMap[a.type]?.order ?? 0;
      const orderB = overrideMap[b.type]?.order ?? 0;
      return orderA - orderB;
    });

  const heroContent = content.hero ?? {};
  const music = invite.music as { url?: string; title?: string; enabled?: boolean } | undefined;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Background music (no autoplay) */}
      {music?.enabled && music.url && (
        <AudioPlayer url={music.url} title={music.title} />
      )}

      {/* Personal greeting banner */}
      {guestName && (
        <div className="sticky top-0 z-40 bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
          Welcome, {guestName}! You&apos;re personally invited 🎊
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-12">
        {enabledSections.map((section) => (
          <SectionRenderer
            key={section.type}
            section={section}
            content={content[section.type] ?? {}}
            inviteId={inviteId}
            guestLinkToken={guestLinkToken}
            guestName={guestName}
            rsvpEnabled={!!(invite.rsvpEnabled)}
            guestbookEnabled={!!(invite.guestbookEnabled)}
          />
        ))}
      </main>

      <footer className="text-center py-8 text-xs text-muted-foreground border-t border-border">
        Made with{" "}
        <a href="/" className="text-primary hover:underline">Shubalekha</a>{" "}
        · Free beautiful invitations
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section renderer — generic fallback + well-known type overrides
// ---------------------------------------------------------------------------

interface SectionProps {
  section: SectionDef;
  content: Record<string, unknown>;
  inviteId: string;
  guestLinkToken?: string;
  guestName?: string;
  rsvpEnabled: boolean;
  guestbookEnabled: boolean;
}

function SectionRenderer({ section, content, inviteId, guestLinkToken, guestName, rsvpEnabled, guestbookEnabled }: SectionProps) {
  const type = section.type as SectionType;

  if (type === "hero") return <HeroSection content={content} />;
  if (type === "eventDetails") return <EventDetailsSection content={content} />;
  if (type === "venueMap") return <VenueMapSection content={content} />;
  if (type === "gallery") return <GallerySection content={content} />;
  if (type === "rsvp" && rsvpEnabled) return (
    <RsvpSection inviteId={inviteId} guestName={guestName} guestLinkToken={guestLinkToken} />
  );
  if (type === "wishes" && guestbookEnabled) return (
    <GuestbookSection inviteId={inviteId} />
  );
  if (type === "liveStream") return <LiveStreamSection content={content} />;
  if (type === "gift") return <GiftSection content={content} />;
  if (type === "countdown") return <CountdownSection content={content} />;

  // Generic: render all text-like fields
  return <GenericSection section={section} content={content} />;
}

function HeroSection({ content }: { content: Record<string, unknown> }) {
  const bride = content.brideName as string | undefined;
  const groom = content.groomName as string | undefined;
  const couple = content.coupleName as string | undefined;
  const subtitle = content.subtitle as string | undefined;
  const heroImage = content.heroImage as string | undefined;

  return (
    <section className="text-center space-y-4 py-8">
      {heroImage && (
        <div className="w-full aspect-[16/7] rounded-2xl overflow-hidden mb-6">
          <img src={heroImage} alt="Hero" className="w-full h-full object-cover" />
        </div>
      )}
      <h1 className="font-display text-4xl sm:text-5xl font-semibold text-primary leading-tight">
        {couple ?? (bride && groom ? `${bride} & ${groom}` : "You're Invited!")}
      </h1>
      {subtitle && <p className="text-lg text-muted-foreground italic">{subtitle}</p>}
    </section>
  );
}

function EventDetailsSection({ content }: { content: Record<string, unknown> }) {
  const venue = content.venue as string | undefined;
  const address = content.address as string | undefined;
  const dateStr = content.date as string | undefined;
  const timeStr = content.time as string | undefined;
  const eventName = content.eventName as string | undefined;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
      {eventName && <h2 className="font-display text-xl font-semibold text-center">{eventName}</h2>}
      <div className="grid gap-3 text-sm">
        {dateStr && (
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{dateStr}{timeStr ? ` at ${timeStr}` : ""}</span>
          </div>
        )}
        {venue && (
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{venue}</p>
              {address && <p className="text-muted-foreground">{address}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function VenueMapSection({ content }: { content: Record<string, unknown> }) {
  const mapUrl = content.mapUrl as string | undefined;
  const embedUrl = content.embedUrl as string | undefined;
  if (!mapUrl && !embedUrl) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" /> Venue
      </h2>
      {embedUrl && (
        <div className="rounded-xl overflow-hidden aspect-video border border-border">
          <iframe src={embedUrl} className="w-full h-full" loading="lazy" title="Venue map" />
        </div>
      )}
      {mapUrl && (
        <a href={mapUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline">
          Open in Google Maps
        </a>
      )}
    </section>
  );
}

function GallerySection({ content }: { content: Record<string, unknown> }) {
  const photos = (content.photos as string[] | undefined) ?? [];
  if (photos.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Gallery</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div key={i} className="aspect-square rounded-xl overflow-hidden">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RsvpSection({ inviteId, guestName, guestLinkToken }: {
  inviteId: string; guestName?: string; guestLinkToken?: string;
}) {
  return (
    <section id="rsvp" className="rounded-2xl border border-border bg-card p-6 space-y-4 scroll-mt-16">
      <h2 className="font-display text-xl font-semibold flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" /> RSVP
      </h2>
      <RsvpForm inviteId={inviteId} guestName={guestName} guestLinkToken={guestLinkToken} />
    </section>
  );
}

function GuestbookSection({ inviteId }: { inviteId: string }) {
  const [entries, setEntries] = useState<{ _id: string; name: string; message: string; createdAt?: string }[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${inviteId}/guestbook`)
      .then((r) => r.json() as Promise<{ data?: typeof entries }>)
      .then((j) => setEntries(j.data ?? []))
      .catch(() => undefined);
  }, [inviteId, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/invites/${inviteId}/guestbook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message }),
    });
    setName(""); setMessage(""); setSubmitted((p) => !p);
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> Wishes & Blessings
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120}
        />
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
          placeholder="Write your wishes..." value={message} onChange={(e) => setMessage(e.target.value)}
          required rows={3} maxLength={600}
        />
        <button type="submit"
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
          Send wishes
        </button>
      </form>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry._id} className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium text-sm">{entry.name}</p>
            <p className="text-sm text-muted-foreground mt-1">{entry.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LiveStreamSection({ content }: { content: Record<string, unknown> }) {
  const url = content.streamUrl as string | undefined;
  if (!url) return null;
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
      <Wifi className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="font-medium text-sm">Live stream available</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
          Watch the ceremony live
        </a>
      </div>
    </section>
  );
}

function GiftSection({ content }: { content: Record<string, unknown> }) {
  const url = content.url as string | undefined;
  const note = content.note as string | undefined;
  if (!url) return null;
  return (
    <section className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <Gift className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="font-medium text-sm">Gift registry</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
          View gift wishlist
        </a>
      </div>
    </section>
  );
}

function CountdownSection({ content }: { content: Record<string, unknown> }) {
  const targetDate = content.targetDate as string | undefined;
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate || !timeLeft) return null;

  return (
    <section className="text-center space-y-3">
      <h2 className="font-display text-xl font-semibold flex items-center justify-center gap-2">
        <Clock className="h-5 w-5 text-primary" /> Counting down
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Days", val: timeLeft.d },
          { label: "Hours", val: timeLeft.h },
          { label: "Mins", val: timeLeft.m },
          { label: "Secs", val: timeLeft.s },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="font-display text-3xl font-bold text-primary">{String(val).padStart(2, "0")}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GenericSection({ section, content }: { section: SectionDef; content: Record<string, unknown> }) {
  const textFields = section.fields.filter((f) =>
    ["text", "longtext", "richtext"].includes(f.type) && content[f.key],
  );
  if (textFields.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold capitalize">
        {section.type.replace(/([A-Z])/g, " $1").trim()}
      </h2>
      {textFields.map((f) => (
        <p key={f.key} className="text-muted-foreground whitespace-pre-wrap">
          {String(content[f.key] ?? "")}
        </p>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Audio player
// ---------------------------------------------------------------------------

function AudioPlayer({ url, title }: { url: string; title?: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useState<HTMLAudioElement | null>(null);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          if (!audioRef[0]) {
            const audio = new Audio(url);
            audio.loop = true;
            audioRef[1](audio);
            audio.play().catch(() => undefined);
            setPlaying(true);
          } else if (playing) {
            audioRef[0].pause();
            setPlaying(false);
          } else {
            audioRef[0].play().catch(() => undefined);
            setPlaying(true);
          }
        }}
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        title={playing ? "Pause music" : `Play: ${title ?? "background music"}`}
      >
        <Music className="h-4 w-4" />
      </button>
    </div>
  );
}
