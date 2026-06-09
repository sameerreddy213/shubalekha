import "server-only";
import { Types } from "mongoose";
import { createHash, randomBytes } from "crypto";
import { dbConnect } from "@/lib/db/connect";
import { GuestLink, Invite } from "@/models";

async function generateToken(): Promise<string> {
  return randomBytes(12).toString("base64url");
}

export async function generateGuestLinks(
  inviteId: string,
  ownerId: string,
  guests: { name: string; group?: string; maxPartySize?: number }[],
) {
  await dbConnect();
  const invite = await Invite.exists({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("NOT_FOUND");

  const links = await Promise.all(
    guests.map(async (g) => ({
      inviteId: new Types.ObjectId(inviteId),
      token: await generateToken(),
      guestName: g.name,
      group: g.group,
      maxPartySize: g.maxPartySize ?? null,
    })),
  );

  const result = await GuestLink.insertMany(links, { ordered: false });
  return result.map((l) => ({ id: l._id.toString(), token: l.token, guestName: l.guestName }));
}

export async function listGuestLinks(inviteId: string, ownerId: string, page = 1, limit = 100) {
  await dbConnect();
  const invite = await Invite.exists({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("NOT_FOUND");

  const filter = { inviteId: new Types.ObjectId(inviteId), deletedAt: null };
  const [items, total] = await Promise.all([
    GuestLink.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    GuestLink.countDocuments(filter),
  ]);
  return { items, total };
}

export async function deleteGuestLink(linkId: string, ownerId: string) {
  await dbConnect();
  const link = await GuestLink.findById(linkId).lean();
  if (!link) throw new Error("NOT_FOUND");

  const invite = await Invite.exists({
    _id: link.inviteId,
    ownerId: new Types.ObjectId(ownerId),
    deletedAt: null,
  });
  if (!invite) throw new Error("FORBIDDEN");

  await GuestLink.updateOne({ _id: linkId }, { $set: { deletedAt: new Date() } });
}

/** Record a guest link open (called from the analytics beacon, not the cached page). */
export async function recordGuestLinkOpen(token: string) {
  await dbConnect();
  const now = new Date();
  await GuestLink.updateOne(
    { token, deletedAt: null },
    {
      $inc: { opens: 1 },
      $set: { lastOpenedAt: now },
      $setOnInsert: { firstOpenedAt: now },
    },
    { upsert: false },
  );
}

/** Resolve guest name from a token (edge-safe lookup — no populate). */
export async function resolveGuestName(token: string): Promise<string | null> {
  await dbConnect();
  const link = await GuestLink.findOne({ token, deletedAt: null }).select("guestName").lean();
  return link?.guestName ?? null;
}

void createHash; // suppress unused import warning
