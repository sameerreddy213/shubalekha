"use client";

/**
 * Live preview panel — renders a phone-frame preview of the invitation
 * using the template palette and the current editor content.
 */

import type { SectionDef } from "@/types/invite";
import type { InviteContent } from "@/types/invite";

interface Palette {
  bg: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
}

interface InvitePreviewProps {
  sections: SectionDef[];
  content: InviteContent;
  palette: Palette;
  templateName: string;
}

function get(content: InviteContent, sectionKey: string, fieldKey: string): string {
  const sec = content[sectionKey] as Record<string, unknown> | undefined;
  return (sec?.[fieldKey] as string) ?? "";
}

/** Format "HH:MM" 24hr to "h:mm AM/PM" */
function fmtTime(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h24 = parseInt(hStr ?? "0", 10);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${mStr ?? "00"} ${period}`;
}

/** Format "YYYY-MM-DD" to "12 July 2025" */
function fmtDate(d: string): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return d; }
}

export function InvitePreview({ sections, content, palette, templateName }: InvitePreviewProps) {
  // Gather hero fields
  const heroSection = sections.find((s) => s.type === "hero");
  const heroKey = heroSection?.key ?? "hero";
  const brideName  = get(content, heroKey, "brideName")  || get(content, heroKey, "personOneName") || get(content, heroKey, "name") || "Name";
  const groomName  = get(content, heroKey, "groomName")  || get(content, heroKey, "personTwoName") || "";
  const tagline    = get(content, heroKey, "tagline");

  // Gather event detail sections (ceremony, reception, or any event_details)
  const eventSections = sections.filter((s) => (s.type as string) === "event_details" || s.type === "eventDetails");

  // RSVP deadline
  const rsvpSection = sections.find((s) => s.type === "rsvp");
  const rsvpKey = rsvpSection?.key ?? "rsvp";
  const rsvpDeadline = get(content, rsvpKey, "deadline");

  const displayName = groomName
    ? `${brideName} & ${groomName}`
    : brideName;

  return (
    <div className="flex h-full flex-col items-center bg-muted/40 py-6 overflow-y-auto">
      <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Live Preview
      </p>

      {/* Phone frame */}
      <div
        className="relative w-[320px] shrink-0 overflow-hidden rounded-[2.5rem] border-[6px] border-foreground/10 shadow-2xl"
        style={{ backgroundColor: palette.bg, minHeight: 580 }}
      >
        {/* Top notch */}
        <div className="absolute left-1/2 top-2.5 h-4 w-20 -translate-x-1/2 rounded-full bg-foreground/10" />

        {/* Invitation content */}
        <div className="mt-8 px-5 pb-8 pt-4 text-center" style={{ color: palette.text }}>

          {/* Decorative top ornament */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.4 }} />
            <span style={{ color: palette.accent, fontSize: 16 }}>✦</span>
            <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.4 }} />
          </div>

          {/* Template name chip */}
          <span
            className="inline-block rounded-full px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest mb-3"
            style={{ backgroundColor: palette.accent + "22", color: palette.accent }}
          >
            {templateName.split("—").at(0)?.trim() ?? templateName}
          </span>

          {/* Names */}
          <h1
            className="font-display text-2xl font-semibold leading-tight"
            style={{ color: palette.primary }}
          >
            {displayName}
          </h1>

          {tagline && (
            <p className="mt-1.5 text-[11px] italic leading-snug" style={{ color: palette.muted }}>
              {tagline}
            </p>
          )}

          {/* Divider */}
          <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1" style={{ backgroundColor: palette.muted, opacity: 0.3 }} />
            <span style={{ color: palette.muted, fontSize: 10, opacity: 0.6 }}>REQUEST THE PLEASURE</span>
            <div className="h-px flex-1" style={{ backgroundColor: palette.muted, opacity: 0.3 }} />
          </div>

          {/* Event cards */}
          {eventSections.length > 0 ? (
            <div className="space-y-2.5">
              {eventSections.map((s) => {
                const date  = get(content, s.key, "date");
                const time  = get(content, s.key, "time");
                const venue = get(content, s.key, "venue");
                const addr  = get(content, s.key, "address");

                const hasAny = date || time || venue || addr;

                return (
                  <div
                    key={s.key}
                    className="rounded-xl px-4 py-3 text-left"
                    style={{ backgroundColor: palette.surface }}
                  >
                    <p
                      className="mb-1.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: palette.accent }}
                    >
                      {s.label ?? s.key}
                    </p>
                    {hasAny ? (
                      <>
                        {date  && <p className="text-[11px] font-semibold" style={{ color: palette.primary }}>{fmtDate(date)}</p>}
                        {time  && <p className="text-[11px]" style={{ color: palette.muted }}>{fmtTime(time)}</p>}
                        {venue && <p className="mt-1 text-[11px] font-medium" style={{ color: palette.text }}>{venue}</p>}
                        {addr  && <p className="text-[10px] leading-snug" style={{ color: palette.muted }}>{addr}</p>}
                      </>
                    ) : (
                      <p className="text-[10px] italic" style={{ color: palette.muted, opacity: 0.5 }}>
                        Fill in details to see them here
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-xl px-4 py-3 text-left"
              style={{ backgroundColor: palette.surface }}
            >
              <p className="text-[10px] italic" style={{ color: palette.muted, opacity: 0.5 }}>
                Event details will appear here
              </p>
            </div>
          )}

          {/* RSVP strip */}
          {rsvpSection && (
            <div className="mt-3 rounded-xl px-4 py-2.5" style={{ backgroundColor: palette.primary + "15" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: palette.primary }}>
                RSVP
                {rsvpDeadline ? ` by ${fmtDate(rsvpDeadline)}` : ""}
              </p>
            </div>
          )}

          {/* Bottom ornament */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.3 }} />
            <span style={{ color: palette.accent, fontSize: 12, opacity: 0.5 }}>✦</span>
            <div className="h-px flex-1" style={{ backgroundColor: palette.accent, opacity: 0.3 }} />
          </div>

          <p className="mt-3 text-[9px] tracking-widest uppercase" style={{ color: palette.muted, opacity: 0.5 }}>
            shubalekha
          </p>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">Updates as you type</p>
    </div>
  );
}
