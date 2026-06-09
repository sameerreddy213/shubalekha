"use client";
import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FieldEditor } from "./field-editor";
import { SlugPicker } from "./slug-picker";
import { saveInviteAction, publishInviteAction, unpublishInviteAction } from "../actions";
import type { SectionDef, InviteContent, SectionOverride, SectionType } from "@/types/invite";
import { cn } from "@/lib/utils/cn";

interface InviteEditorProps {
  inviteId: string;
  initialContent: InviteContent;
  initialSectionOverrides: SectionOverride[];
  initialEventDate?: string;
  initialSlug?: string;
  initialStatus: string;
  sections: SectionDef[];
  templateName: string;
}

// Label shown in the sidebar — prefer the section's own label field,
// then fall back to a generic map by type, then the raw key.
const TYPE_LABELS: Partial<Record<SectionType, string>> = {
  hero: "Hero / Title",
  blessings: "Blessings",
  invitationText: "Invitation Text",
  welcomeMessage: "Welcome Message",
  eventDetails: "Event Details",
  timeline: "Timeline",
  countdown: "Countdown",
  familyMembers: "Family Members",
  venueMap: "Venue Map",
  thingsToKnow: "Things to Know",
  ourStory: "Our Story",
  gallery: "Photo Gallery",
  wishes: "Wishes",
  rsvp: "RSVP",
  contactCards: "Contact Cards",
  qrCode: "QR Code",
  socialShare: "Share",
  addToCalendar: "Add to Calendar",
  music: "Background Music",
  liveStream: "Live Stream",
  gift: "Gift / Shagun",
  closing: "Closing",
};

function sectionLabel(s: SectionDef) {
  return s.label ?? TYPE_LABELS[s.type as SectionType] ?? s.key;
}

export function InviteEditor({
  inviteId,
  initialContent,
  initialSectionOverrides,
  initialEventDate,
  initialSlug,
  initialStatus,
  sections,
  templateName,
}: InviteEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState<InviteContent>(initialContent);
  const [sectionOverrides, setSectionOverrides] = useState<SectionOverride[]>(initialSectionOverrides);
  const [eventDate, setEventDate] = useState(initialEventDate ?? "");
  // activeSection tracks section.key (unique per section, even if type repeats)
  const [activeSection, setActiveSection] = useState<string>(sections.at(0)?.key ?? "");
  const [publishOpen, setPublishOpen] = useState(false);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [status, setStatus] = useState(initialStatus);
  const [dirty, setDirty] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Override map keyed by section.key (not type, since type can repeat)
  const overrideMap = Object.fromEntries(sectionOverrides.map((o) => [o.type, o]));

  function getSectionEnabled(s: SectionDef) {
    const override = overrideMap[s.key];
    if (override !== undefined) return override.enabled;
    // Default: enabled unless section explicitly marks optional + enabledByDefault = false
    return s.enabledByDefault !== false;
  }

  // Content is stored/read by section.key so ceremony ≠ reception
  function updateFieldValue(sectionKey: string, fieldKey: string, value: unknown) {
    setContent((prev) => {
      const sectionContent = ((prev[sectionKey] ?? {}) as Record<string, unknown>);
      return { ...prev, [sectionKey]: { ...sectionContent, [fieldKey]: value } };
    });
    setDirty(true);
    scheduleAutosave();
  }

  function getFieldValue(sectionKey: string, fieldKey: string): unknown {
    return ((content[sectionKey] ?? {}) as Record<string, unknown>)[fieldKey];
  }

  function toggleSection(s: SectionDef) {
    if (!s.optional) return;
    const current = getSectionEnabled(s);
    setSectionOverrides((prev) => {
      const rest = prev.filter((o) => o.type !== (s.key as SectionType));
      return [...rest, { type: s.key as SectionType, enabled: !current, order: 0 }];
    });
    setDirty(true);
    scheduleAutosave();
  }

  function scheduleAutosave() {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(() => autosave(), 2000);
  }

  const autosave = useCallback(() => {
    startTransition(async () => {
      try {
        await saveInviteAction({ inviteId, content, sectionOverrides, eventDate: eventDate || undefined });
        setDirty(false);
      } catch { /* silent */ }
    });
  }, [inviteId, content, sectionOverrides, eventDate]);

  async function handleManualSave() {
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    startTransition(async () => {
      try {
        await saveInviteAction({ inviteId, content, sectionOverrides, eventDate: eventDate || undefined });
        setDirty(false);
        toast.success("Saved");
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  async function handlePublish() {
    startTransition(async () => {
      try {
        await saveInviteAction({ inviteId, content, sectionOverrides, eventDate: eventDate || undefined });
        const result = await publishInviteAction({ inviteId, slug });
        setStatus("published");
        setPublishOpen(false);
        toast.success("Invite is live!", { description: `/${result.slug}` });
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        if (msg === "SLUG_TAKEN")          toast.error("That URL is already taken");
        else if (msg === "SLUG_RESERVED")  toast.error("That URL is reserved");
        else if (msg?.startsWith("VALIDATION:")) toast.error("Fill in required fields first");
        else toast.error("Could not publish");
      }
    });
  }

  async function handleUnpublish() {
    if (!confirm("Take this invite offline? Guests won't be able to see it.")) return;
    startTransition(async () => {
      try {
        await unpublishInviteAction(inviteId);
        setStatus("draft");
        toast.success("Invite unpublished");
        router.refresh();
      } catch {
        toast.error("Failed to unpublish");
      }
    });
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const activeSectionDef = sections.find((s) => s.key === activeSection);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <div>
            <p className="text-sm font-medium leading-none">{templateName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "published"
                ? <span className="text-green-600 font-medium">Published</span>
                : <span className="capitalize">{status}</span>}
              {dirty && " · Unsaved"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "published" && (
            <Button variant="ghost" size="sm" onClick={handleUnpublish} disabled={isPending}>
              Unpublish
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleManualSave} disabled={isPending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" onClick={() => setPublishOpen(true)} disabled={isPending} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — section nav */}
        <aside className="w-56 shrink-0 border-r border-border overflow-y-auto">
          <div className="p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Sections
            </p>
            <nav className="space-y-0.5">
              {sections.map((section) => {
                const enabled = getSectionEnabled(section);
                const active = activeSection === section.key;
                return (
                  // ✅ Use section.key — unique even when type repeats
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                      active ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted",
                      !enabled && "opacity-40",
                    )}
                  >
                    <span className="truncate">{sectionLabel(section)}</span>
                    {active && <ChevronRight className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </nav>

            <Separator className="my-3" />
            <div className="px-1 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Event Date
              </Label>
              <Input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => { setEventDate(e.target.value); setDirty(true); scheduleAutosave(); }}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </aside>

        {/* Main editor panel */}
        <main className="flex-1 overflow-y-auto">
          {activeSectionDef && (
            <div className="max-w-2xl mx-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold">{sectionLabel(activeSectionDef)}</h2>
                  {activeSectionDef.optional && (
                    <p className="text-xs text-muted-foreground mt-0.5">Optional section</p>
                  )}
                </div>
                {activeSectionDef.optional && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${activeSectionDef.key}`} className="text-sm">
                      {getSectionEnabled(activeSectionDef) ? "Enabled" : "Disabled"}
                    </Label>
                    <Switch
                      id={`toggle-${activeSectionDef.key}`}
                      checked={getSectionEnabled(activeSectionDef)}
                      onCheckedChange={() => toggleSection(activeSectionDef)}
                    />
                  </div>
                )}
              </div>

              {!getSectionEnabled(activeSectionDef) ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                  This section is disabled. Toggle it on to edit.
                </div>
              ) : activeSectionDef.repeatable ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-4">
                  Repeatable sections can be managed after publishing. Full editing coming soon.
                </p>
              ) : activeSectionDef.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-4">
                  No editable fields in this section.
                </p>
              ) : (
                <div className="space-y-5">
                  {activeSectionDef.fields.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      // ✅ Index content by section.key, not section.type
                      value={getFieldValue(activeSectionDef.key, field.key)}
                      onChange={(v) => updateFieldValue(activeSectionDef.key, field.key, v)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!activeSectionDef && sections.length > 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select a section from the left panel.
            </div>
          )}
        </main>
      </div>

      {/* Publish dialog */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {status === "published" ? "Update live invite" : "Publish your invite"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <SlugPicker value={slug} onChange={setSlug} />
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Before you publish</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>Make sure all required fields are filled in</li>
                <li>The invite URL cannot be changed after publishing</li>
                <li>Guests can see this invite immediately</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={isPending || slug.length < 3} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              {isPending ? "Publishing…" : status === "published" ? "Update" : "Go live"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
