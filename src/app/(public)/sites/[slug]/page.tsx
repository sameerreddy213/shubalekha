import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { getPublishedInviteBySlug } from "@/features/invites/services";
import { PublicInvitePage } from "@/features/invites/components/public-invite-page";
import type { InviteDoc, TemplateDoc } from "@/models";
import type { SectionDef } from "@/types/invite";
import { inviteUrl } from "@/config/site";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string }>;
}

// ISR: revalidate on-demand via revalidateTag(`invite:${slug}`)
const getCachedInvite = unstable_cache(
  async (slug: string) => getPublishedInviteBySlug(slug),
  ["invite-page"],
  { tags: ["invite-page"], revalidate: 60 },
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const invite = await getCachedInvite(slug);
  if (!invite) return { title: "Invitation not found" };

  const inv = invite as unknown as InviteDoc & { templateId: TemplateDoc };
  const seo = inv.seo as { title?: string; description?: string; ogImageUrl?: string } | undefined;
  const content = inv.content as Record<string, Record<string, string>> | null;
  const heroContent = content?.hero ?? {};

  const title = seo?.title
    ?? (heroContent.brideName && heroContent.groomName
      ? `${heroContent.brideName} & ${heroContent.groomName} — You're Invited!`
      : `You're Invited!`);

  return {
    title,
    description: seo?.description,
    openGraph: {
      title,
      description: seo?.description,
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : [],
      url: inviteUrl(slug),
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { to: guestLinkToken } = await searchParams;

  const invite = await getCachedInvite(slug);
  if (!invite) notFound();

  const inv = invite as unknown as InviteDoc & {
    _id: { toString(): string };
    templateId: TemplateDoc & { sections: SectionDef[] };
  };

  return (
    <PublicInvitePage
      inviteId={inv._id.toString()}
      invite={inv}
      template={inv.templateId}
      guestLinkToken={guestLinkToken}
    />
  );
}
