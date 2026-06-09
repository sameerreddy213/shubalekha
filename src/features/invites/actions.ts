"use server";
import { requireUser } from "@/lib/auth/guards";
import {
  createInvite, saveInvite, publishInvite, unpublishInvite,
  archiveInvite, softDeleteInvite, duplicateInvite,
  type SaveInviteInput, type PublishInviteInput,
} from "./services";

export async function createInviteAction(templateId: string, variantKey?: string) {
  const user = await requireUser();
  return createInvite({ templateId, variantKey, ownerId: user.id });
}

export async function saveInviteAction(input: Omit<SaveInviteInput, "ownerId">) {
  const user = await requireUser();
  return saveInvite({ ...input, ownerId: user.id });
}

export async function publishInviteAction(input: Omit<PublishInviteInput, "ownerId">) {
  const user = await requireUser();
  return publishInvite({ ...input, ownerId: user.id });
}

export async function unpublishInviteAction(inviteId: string) {
  const user = await requireUser();
  return unpublishInvite(inviteId, user.id);
}

export async function archiveInviteAction(inviteId: string) {
  const user = await requireUser();
  return archiveInvite(inviteId, user.id);
}

export async function deleteInviteAction(inviteId: string) {
  const user = await requireUser();
  return softDeleteInvite(inviteId, user.id);
}

export async function duplicateInviteAction(inviteId: string) {
  const user = await requireUser();
  return duplicateInvite(inviteId, user.id);
}
