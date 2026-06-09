import "server-only";
import { createHash } from "crypto";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Guestbook, Invite } from "@/models";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function submitGuestbookEntry(
  inviteId: string,
  name: string,
  message: string,
  ip: string,
  guestLinkToken?: string,
) {
  await dbConnect();
  const invite = await Invite.findOne({ _id: inviteId, status: "published", deletedAt: null });
  if (!invite) throw new Error("INVITE_NOT_FOUND");
  if (!invite.guestbookEnabled) throw new Error("GUESTBOOK_DISABLED");

  const entry = await Guestbook.create({
    inviteId: new Types.ObjectId(inviteId),
    name,
    message,
    ipHash: hashIp(ip),
  });
  void guestLinkToken; // Phase 11 will link guest link ID
  return { entryId: entry._id.toString() };
}

export async function listGuestbookEntries(inviteId: string, isOwner = false) {
  await dbConnect();
  const filter: Record<string, unknown> = {
    inviteId: new Types.ObjectId(inviteId),
    deletedAt: null,
  };
  if (!isOwner) filter.hidden = false;
  return Guestbook.find(filter).sort({ createdAt: -1 }).limit(100).lean();
}

export async function toggleGuestbookHidden(entryId: string, inviteId: string, ownerId: string, hidden: boolean) {
  await dbConnect();
  const invite = await Invite.exists({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("FORBIDDEN");
  await Guestbook.updateOne({ _id: entryId, inviteId: new Types.ObjectId(inviteId) }, { $set: { hidden } });
}

export async function deleteGuestbookEntry(entryId: string, inviteId: string, ownerId: string) {
  await dbConnect();
  const invite = await Invite.exists({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("FORBIDDEN");
  await Guestbook.updateOne(
    { _id: entryId, inviteId: new Types.ObjectId(inviteId) },
    { $set: { deletedAt: new Date() } },
  );
}
