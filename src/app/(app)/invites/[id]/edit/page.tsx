import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { getInviteById } from "@/features/invites/services";
import { InviteEditor } from "@/features/invites/components/invite-editor";
import type { TemplateDoc, InviteDoc } from "@/models";
import type { SectionDef, SectionOverride } from "@/types/invite";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Edit Invitation — Shubalekha` };
}

export default async function EditInvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const invite = await getInviteById(id, user.id);
  if (!invite) notFound();

  const inv = invite as unknown as InviteDoc & {
    _id: { toString(): string };
    templateId: TemplateDoc & { sections: SectionDef[] };
  };

  const template = inv.templateId as (TemplateDoc & { sections: SectionDef[] }) | null;
  if (!template) notFound();

  return (
    <InviteEditor
      inviteId={id}
      initialContent={(inv.content as Record<string, unknown>) ?? {}}
      initialSectionOverrides={(inv.sectionOverrides as SectionOverride[]) ?? []}
      initialEventDate={inv.eventDate ? new Date(inv.eventDate as unknown as string).toISOString().slice(0, 16) : undefined}
      initialSlug={typeof inv.slug === "string" ? inv.slug : ""}
      initialStatus={inv.status as string}
      sections={template.sections ?? []}
      templateName={template.name}
    />
  );
}
