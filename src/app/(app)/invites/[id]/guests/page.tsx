import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { getInviteById } from "@/features/invites/services";
import { listRsvps } from "@/features/rsvp/services";
import { listGuestLinks } from "@/features/guestlinks/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Download } from "lucide-react";
import type { RsvpDoc, GuestLinkDoc, InviteDoc } from "@/models";

export const metadata: Metadata = { title: "Guests — Shubalekha" };
export const dynamic = "force-dynamic";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const invite = await getInviteById(id, user.id);
  if (!invite) notFound();

  const [rsvpData, guestLinksData] = await Promise.all([
    listRsvps(id, user.id, 1, 200),
    listGuestLinks(id, user.id, 1, 200),
  ]);

  const inv = invite as InviteDoc & { _id: { toString(): string } };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/invites/${id}/edit`} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Back to editor
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Guests</h1>
        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <a href={`/api/invites/${id}/rsvps/export`} download>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold text-green-600">{(inv.stats as { rsvpYes?: number })?.rsvpYes ?? 0}</p>
          <p className="text-sm text-muted-foreground">Attending</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold text-red-500">{(inv.stats as { rsvpNo?: number })?.rsvpNo ?? 0}</p>
          <p className="text-sm text-muted-foreground">Not attending</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-2xl font-bold text-yellow-600">{(inv.stats as { rsvpMaybe?: number })?.rsvpMaybe ?? 0}</p>
          <p className="text-sm text-muted-foreground">Maybe</p>
        </div>
      </div>

      <Tabs defaultValue="rsvps">
        <TabsList>
          <TabsTrigger value="rsvps">RSVPs ({rsvpData.total})</TabsTrigger>
          <TabsTrigger value="links">Guest links ({guestLinksData.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="rsvps" className="mt-4">
          {rsvpData.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">No RSVPs yet.</p>
          ) : (
            <div className="space-y-2">
              {rsvpData.items.map((rsvp) => {
                const r = rsvp as RsvpDoc & { _id: { toString(): string } };
                return (
                  <div key={r._id.toString()} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email ?? r.phone ?? "No contact"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">×{r.partySize ?? 1}</span>
                      <Badge variant={r.status === "attending" ? "default" : "secondary"} className="text-xs">
                        {r.status === "attending" ? "Attending" : r.status === "not_attending" ? "Not attending" : "Maybe"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          <GuestLinksPanel inviteId={id} items={guestLinksData.items as (GuestLinkDoc & { _id: { toString(): string } })[]} slug={typeof inv.slug === "string" ? inv.slug : undefined} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuestLinksPanel({
  inviteId, items, slug,
}: {
  inviteId: string;
  items: (GuestLinkDoc & { _id: { toString(): string } })[];
  slug?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground space-y-2">
        <p>No personalised links yet.</p>
        <p>
          Generate links from the{" "}
          <Link href={`/invites/${inviteId}/edit`} className="text-primary underline">editor</Link>{" "}
          to greet each guest by name.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((link) => (
        <div key={link._id.toString()} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-sm">{link.guestName}</p>
            {link.group && <p className="text-xs text-muted-foreground">{link.group}</p>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            <span>{link.opens ?? 0} opens</span>
            {slug && (
              <a
                href={`https://${slug}.shubalekha.com?to=${link.token}`}
                target="_blank" rel="noopener noreferrer"
                className="text-primary underline"
              >
                Link
              </a>
            )}
            {link.rsvpId ? (
              <Badge variant="default" className="text-xs">RSVP'd</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Pending</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
