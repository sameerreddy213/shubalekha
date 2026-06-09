"use server";
import { submitRsvp, updateRsvp, type SubmitRsvpInput } from "./services";

export async function submitRsvpAction(input: SubmitRsvpInput) {
  return submitRsvp(input);
}

export async function updateRsvpAction(
  editToken: string,
  update: { status: SubmitRsvpInput["status"]; partySize?: number; meal?: string; message?: string },
) {
  return updateRsvp(editToken, update as Parameters<typeof updateRsvp>[1]);
}
