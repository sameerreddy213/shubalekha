"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Globe, PenLine, Copy, Archive, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  duplicateInviteAction, archiveInviteAction, deleteInviteAction,
} from "../actions";
import { cn } from "@/lib/utils/cn";
import { inviteUrl } from "@/config/site";

type Status = "draft" | "published" | "expired" | "archived";

interface InviteCardProps {
  id: string;
  title?: string;
  slug?: string;
  status: Status;
  eventDate?: string;
  stats?: { views: number; rsvpYes: number };
  previewImage?: string;
  templateName?: string;
}

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  archived: "bg-muted text-muted-foreground",
};

export function InviteCard({
  id, title, slug, status, eventDate, stats, previewImage, templateName,
}: InviteCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    try {
      const r = await duplicateInviteAction(id);
      router.push(`/invites/${r.inviteId}/edit`);
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    setLoading(true);
    try {
      await archiveInviteAction(id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this invite? This cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteInviteAction(id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const displayTitle = title || "Untitled invitation";
  const liveUrl = slug ? inviteUrl(slug) : null;

  return (
    <div className={cn(
      "group relative rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md",
      loading && "opacity-50 pointer-events-none",
    )}>
      {/* Preview image / placeholder */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {previewImage ? (
          <img src={previewImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <PenLine className="h-8 w-8 opacity-30" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", STATUS_STYLES[status])}>
            {status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <p className="font-semibold text-sm truncate text-foreground">{displayTitle}</p>
          {templateName && <p className="text-xs text-muted-foreground mt-0.5">{templateName}</p>}
          {eventDate && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>

        {stats && status === "published" && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><Eye className="inline h-3 w-3 mr-1" />{stats.views}</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {stats.rsvpYes} attending
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="default" className="flex-1 h-8 text-xs">
            <a href={`/invites/${id}/edit`}>Edit</a>
          </Button>

          {liveUrl && (
            <Button asChild size="sm" variant="outline" className="h-8 w-8 p-0">
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <Globe className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              {status !== "archived" && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-3.5 w-3.5" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
