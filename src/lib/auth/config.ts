import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { Types } from "mongoose";
import { clientPromise } from "@/lib/db/client";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/models";
import { env, isDev } from "@/lib/env";
import { sendEmail } from "@/lib/email/resend";
import { magicLinkEmail } from "@/lib/email/templates";

/**
 * Auth.js (NextAuth v5) configuration — see docs/02-System-Architecture.md §8.
 *
 * - Providers: Google OAuth + Resend magic-link. Each is enabled only when its
 *   credentials are present, so a fresh clone boots without any keys.
 * - Sessions: database-backed (via the MongoDB adapter) so admins can revoke /
 *   disable accounts. Falls back to JWT only when no DB is configured (dev).
 * - Disabled users are blocked at sign-in.
 *
 * This module is Node-only (imports Mongoose/mongodb). It must never be imported
 * from edge middleware — route protection lives in server layouts/guards instead.
 */

const providers: NextAuthConfig["providers"] = [];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url }) {
        const { subject, html, text } = magicLinkEmail(url);
        await sendEmail({ to: identifier, subject, html, text });
      },
    }),
  );
}

const adapter = clientPromise
  ? MongoDBAdapter(clientPromise, { databaseName: env.MONGODB_DB })
  : undefined;

export const authConfig: NextAuthConfig = {
  adapter,
  providers,
  session: { strategy: adapter ? "database" : "jwt" },
  secret: env.AUTH_SECRET ?? (isDev ? "dev-insecure-secret-change-me" : undefined),
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/login",
  },
  callbacks: {
    // Block disabled accounts from signing in.
    async signIn({ user }) {
      const status = (user as { status?: string } | null)?.status;
      return status !== "disabled";
    },
    // Expose id/role/status to the session (database strategy passes the DB user).
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: "user" | "admin" }).role ?? "user";
        session.user.status = (user as { status?: "active" | "disabled" }).status ?? "active";
      }
      return session;
    },
  },
  events: {
    // Adapter-created users bypass Mongoose defaults; set them explicitly.
    async createUser({ user }) {
      if (!user.id || !Types.ObjectId.isValid(user.id)) return;
      try {
        await dbConnect();
        await User.updateOne(
          { _id: new Types.ObjectId(user.id) },
          { $set: { role: "user", status: "active", plan: "free", lastLoginAt: new Date() } },
        );
      } catch (err) {
        console.error("createUser defaults failed:", err);
      }
    },
    async signIn({ user }) {
      if (!user?.id || !adapter || !Types.ObjectId.isValid(user.id)) return;
      try {
        await dbConnect();
        await User.updateOne(
          { _id: new Types.ObjectId(user.id) },
          { $set: { lastLoginAt: new Date() } },
        );
      } catch {
        /* non-fatal */
      }
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/** Provider availability flags (the login UI uses these to show the right buttons). */
export const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
export const emailEnabled = Boolean(env.RESEND_API_KEY);
export const authConfigured = providers.length > 0;
