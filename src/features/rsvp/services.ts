import "server-only";
import { createHash } from "crypto";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Invite, Rsvp, GuestLink } from "@/models";
import { opaqueToken } from "@/lib/security/tokens";
import type { RsvpStatus, MealPref } from "@/types/invite";

export interface SubmitRsvpInput {
  inviteId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status: RsvpStatus;
  partySize?: number;
  meal?: MealPref;
  message?: string;
  guestLinkToken?: string;
  source?: string;
}

function buildDedupeKey(name: string, email?: string | null, phone?: string | null): string {
  const normalized = [
    (email ?? "").toLowerCase().trim(),
    (phone ?? "").replace(/\s/g, ""),
    name.toLowerCase().trim(),
  ].join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export async function submitRsvp(input: SubmitRsvpInput) {
  await dbConnect();

  const invite = await Invite.findOne({ _id: input.inviteId, status: "published", deletedAt: null });
  if (!invite) throw new Error("INVITE_NOT_FOUND");
  if (!invite.rsvpEnabled) throw new Error("RSVP_DISABLED");

  let guestLinkId: Types.ObjectId | null = null;
  if (input.guestLinkToken) {
    const gl = await GuestLink.findOne({ token: input.guestLinkToken, inviteId: invite._id, deletedAt: null });
    if (gl) guestLinkId = gl._id as Types.ObjectId;
  }

  const dedupeKey = buildDedupeKey(input.name, input.email, input.phone);
  const editToken = await opaqueToken();

  try {
    const rsvp = await Rsvp.create({
      inviteId: invite._id,
      guestLinkId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      status: input.status,
      partySize: input.partySize ?? 1,
      meal: input.meal ?? "none",
      message: input.message,
      dedupeKey,
      editToken,
      source: input.source ?? "direct",
    });

    // Update denormalized counters
    const counterField = input.status === "attending" ? "stats.rsvpYes"
      : input.status === "not_attending" ? "stats.rsvpNo" : "stats.rsvpMaybe";
    await Invite.updateOne({ _id: invite._id }, { $inc: { [counterField]: 1 } });

    // Link guest link to this RSVP
    if (guestLinkId) {
      await GuestLink.updateOne({ _id: guestLinkId }, { $set: { rsvpId: rsvp._id } });
    }

    return { editToken, rsvpId: rsvp._id.toString() };
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 11000) throw new Error("ALREADY_RSVPED");
    throw err;
  }
}

export async function getRsvpByToken(editToken: string) {
  await dbConnect();
  return Rsvp.findOne({ editToken, deletedAt: null }).lean();
}

export async function updateRsvp(
  editToken: string,
  update: Pick<SubmitRsvpInput, "status" | "partySize" | "meal" | "message">,
) {
  await dbConnect();
  const rsvp = await Rsvp.findOne({ editToken, deletedAt: null });
  if (!rsvp) throw new Error("NOT_FOUND");

  const oldStatus = rsvp.status as string;
  rsvp.status = update.status;
  if (update.partySize !== undefined) rsvp.partySize = update.partySize;
  if (update.meal !== undefined) rsvp.meal = update.meal as never;
  if (update.message !== undefined) rsvp.message = update.message;
  await rsvp.save();

  // Adjust counters
  const dec = oldStatus === "attending" ? "stats.rsvpYes"
    : oldStatus === "not_attending" ? "stats.rsvpNo" : "stats.rsvpMaybe";
  const inc = update.status === "attending" ? "stats.rsvpYes"
    : update.status === "not_attending" ? "stats.rsvpNo" : "stats.rsvpMaybe";
  if (dec !== inc) {
    await Invite.updateOne(
      { _id: rsvp.inviteId },
      { $inc: { [dec]: -1, [inc]: 1 } },
    );
  }

  return { rsvpId: rsvp._id.toString() };
}

export async function listRsvps(inviteId: string, ownerId: string, page = 1, limit = 50) {
  await dbConnect();
  const invite = await Invite.exists({ _id: inviteId, ownerId: new Types.ObjectId(ownerId), deletedAt: null });
  if (!invite) throw new Error("NOT_FOUND");

  const filter = { inviteId: new Types.ObjectId(inviteId), deletedAt: null };
  const [items, total] = await Promise.all([
    Rsvp.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Rsvp.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}
