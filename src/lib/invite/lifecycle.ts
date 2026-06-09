import "server-only";

const EXPIRE_DAYS = 10;
const SLUG_RELEASE_DAYS = 30;

/** Compute expiresAt and slugReleaseAt from event date. */
export function computeLifecycleDates(eventDate: Date) {
  const expiresAt = new Date(eventDate);
  expiresAt.setDate(expiresAt.getDate() + EXPIRE_DAYS);

  const slugReleaseAt = new Date(expiresAt);
  slugReleaseAt.setDate(slugReleaseAt.getDate() + SLUG_RELEASE_DAYS);

  return { expiresAt, slugReleaseAt };
}

/** Returns the computed status of an invite based on dates. Used compute-on-read for display. */
export function computeStatus(
  storedStatus: string,
  expiresAt: Date | null | undefined,
  slugReleaseAt: Date | null | undefined,
): string {
  if (storedStatus === "draft" || storedStatus === "archived") return storedStatus;
  const now = new Date();
  if (expiresAt && now > expiresAt) return "expired";
  return storedStatus;
}

/** Determine which invites need lifecycle updates (for the cron job). */
export interface LifecycleCandidate {
  _id: string;
  status: string;
  expiresAt?: Date;
  slugReleaseAt?: Date;
  slug?: string;
}

export function needsExpiry(invite: LifecycleCandidate): boolean {
  return (
    invite.status === "published" &&
    !!invite.expiresAt &&
    new Date() > invite.expiresAt
  );
}

export function needsSlugRelease(invite: LifecycleCandidate): boolean {
  return (
    invite.status === "expired" &&
    !!invite.slugReleaseAt &&
    new Date() > invite.slugReleaseAt &&
    !!invite.slug
  );
}
