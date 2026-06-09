import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let _resend: Resend | null = null;

/** Lazily-constructed Resend client. Throws (at send time) if no API key. */
export function getResend(): Resend {
  if (!_resend) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured (see .env.example).");
    }
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailArgs) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
    replyTo,
  });
  if (error) {
    throw new Error(`Resend send failed: ${error.message}`);
  }
  return data;
}
