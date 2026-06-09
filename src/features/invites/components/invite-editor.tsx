"use client";
import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Send, Eye, ChevronLeft, Settings2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const SECTION_LABELS: Partial<Record<SectionType, string>> = {
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
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.type ?? "");
  const [publishOpen, setPublishOpen] = useState(false);
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [status, setStatus] = useState(initialStatus);
  const [dirty, setDirty] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map for quick override lookup
  const overrideMap = Object.fromEntries(sectionOverrides.map((o) => [o.type, o]));

  function getSectionEnabled(type: string) {
    const section = sections.find((s) => s.type === type);
    if (!section) return false;
    return overrideMap[type]?.enabled ?? section.enabledByDefault;
  }

  function updateFieldValue(sectionType: string, fieldKey: string, value: unknown) {
    setContent((prev) => {
      const sectionContent = ((prev[sectionType] ?? {}) as Record<string, unknown>);
      return { ...prev, [sectionType]: { ...sectionContent, [fieldKey]: value } };
    });
    setDirty(true);
    scheduleAutosave();
  }

  function getFieldValue(sectionType: string, fieldKey: string): unknown {
    return ((content[sectionType] ?? {}) as Record<string, unknown>)[fieldKey];
  }

  function toggleSection(type: string) {
    const section = sections.find((s) => s.type === type);
    if (!section || !section.optional) return;
    const current = getSectionEnabled(type);
    setSectionOverrides((prev) => {
      const rest = prev.filter((o) => o.type !== type);
      return [...rest, { type: type as SectionType, enabled: !current, order: section.enabledByDefault ? 0 : 99 }];
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
        await saveInviteAction({
          inviteId,
          content,
          sectionOverrides,
          eventDate: eventDate || undefined,
        });
        setDirty(false);
      } catch {
        // silent autosave failure; manual save still works
      }
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
        if (msg === "SLUG_TAKEN") toast.error("That URL is already taken");
        else if (msg === "SLUG_RESERVED") toast.error("That URL is reserved");
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

  // Warn unsaved on nav
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const activeSectionDef = sections.find((s) => s.type === activeSection);

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
            <p className="text-sm font-medium text-foreground leading-none">{templateName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === "published" ? (
                <span className="text-green-600 font-medium">Published</span>
              ) : (
                <span className="capitalize">{status}</span>
              )}
              {dirty && " · Unsaved changes"}
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
                const enabled = getSectionEnabled(section.type);
                const active = activeSection === section.type;
                return (
                  <button
                    key={section.type}
                    onClick={() => setActiveSection(section.type)}
                    className={cn(
                      "w-full text-left flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted",
                      !enabled && "opacity-40",
                    )}
                  >
                    <span className="truncate">{SECTION_LABELS[section.type as SectionType] ?? section.type}</span>
                    {active && <ChevronRight className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </nav>

            {/* Event date in sidebar */}
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
                  <h2 className="text-lg font-semibold">
                    {SECTION_LABELS[activeSectionDef.type as SectionType] ?? activeSectionDef.type}
                  </h2>
                  {activeSectionDef.optional && (
                    <p className="text-xs text-muted-foreground mt-0.5">Optional section</p>
                  )}
                </div>
                {activeSectionDef.optional && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`toggle-${activeSectionDef.type}`} className="text-sm">
                      {getSectionEnabled(activeSectionDef.type) ? "Enabled" : "Disabled"}
                    </Label>
                    <Switch
                      id={`toggle-${activeSectionDef.type}`}
                      checked={getSectionEnabled(activeSectionDef.type)}
                      onCheckedChange={() => toggleSection(activeSectionDef.type)}
                    />
                  </div>
                )}
              </div>

              {!getSectionEnabled(activeSectionDef.type) ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                  This section is disabled. Toggle it on to edit.
                </div>
              ) : activeSectionDef.repeatable ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-4">
                  Repeatable sections (like multiple events, timeline entries) can be managed
                  after publishing. Full editing coming in the next phase.
                </p>
              ) : (
                <div className="space-y-5">
                  {activeSectionDef.fields.map((field) => (
                    <FieldEditor
                      key={field.key}
                      field={field}
                      value={getFieldValue(activeSectionDef.type, field.key)}
                      onChange={(v) => updateFieldValue(activeSectionDef.type, field.key, v)}
                    />
                  ))}
                </div>
              )}
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
                <li>Guests will be able to see this invite immediately</li>
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
